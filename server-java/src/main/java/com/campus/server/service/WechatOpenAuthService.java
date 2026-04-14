package com.campus.server.service;

import com.campus.server.config.AppProperties;
import com.campus.server.entity.UserAccount;
import com.campus.server.repo.UserAccountRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

/**
 * 微信开放平台「网站应用」扫码登录（OAuth2 snsapi_login）。未配置 appId 时由 {@link #openQrConfigured()} 为 false，
 * 前端可继续走演示用 mock 二维码流程。
 */
@Service
public class WechatOpenAuthService {
  private static final Logger log = LoggerFactory.getLogger(WechatOpenAuthService.class);
  private static final long POLL_TTL_MS = 120_000;

  private final AppProperties appProperties;
  private final UserAccountRepo userRepo;
  private final JwtService jwtService;
  private final ObjectMapper objectMapper;
  private final RestClient restClient = RestClient.create();
  private final ConcurrentHashMap<String, Pending> pendingByPollId = new ConcurrentHashMap<>();

  public WechatOpenAuthService(
    AppProperties appProperties, UserAccountRepo userRepo, JwtService jwtService, ObjectMapper objectMapper) {
    this.appProperties = appProperties;
    this.userRepo = userRepo;
    this.jwtService = jwtService;
    this.objectMapper = objectMapper;
  }

  public boolean openQrConfigured() {
    var wx = appProperties.getWechatOpen();
    return wx.isEnabled()
      && wx.getAppId() != null
      && !wx.getAppId().isBlank()
      && wx.getAppSecret() != null
      && !wx.getAppSecret().isBlank();
  }

  public Map<String, Object> capabilities() {
    var p = appProperties.getPush();
    String pk = p.getVapidPublicKey() == null ? "" : p.getVapidPublicKey();
    return Map.of(
      "openQrEnabled", openQrConfigured(),
      "mockQrAvailable", true,
      "vapidPublicKey", pk);
  }

  /**
   * @param studentId 可选。若与 password 同时提供：首次绑定微信到该学号；均留空：仅用已绑定的 OpenID 登录。
   */
  public Map<String, Object> openInit(String studentId, String password) {
    if (!openQrConfigured()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "未启用微信开放平台登录（请配置 WECHAT_OPEN_*）。");
    }
    boolean hasId = studentId != null && !studentId.isBlank();
    boolean hasPwd = password != null && !password.isBlank();
    if (hasId != hasPwd) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "首次绑定需同时填写学号与密码；仅登录请两者都留空。");
    }
    String pollId = UUID.randomUUID().toString().replace("-", "");
    long expiresAt = System.currentTimeMillis() + POLL_TTL_MS;
    if (hasId) {
      UserAccount user =
        userRepo.findById(studentId.trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "学号不存在。"));
      if (!user.password.equals(password)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "学号或密码错误。");
      }
      if (user.wechatOpenId != null && !user.wechatOpenId.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "该学号已绑定微信，请直接扫码登录（无需再填学号密码）。");
      }
      pendingByPollId.put(pollId, Pending.bind(studentId.trim(), expiresAt));
    } else {
      pendingByPollId.put(pollId, Pending.login(expiresAt));
    }
    String iframeUrl = buildQrConnectUrl(pollId);
    return Map.of("pollId", pollId, "iframeUrl", iframeUrl, "expiresAt", expiresAt);
  }

  private String buildQrConnectUrl(String state) {
    var wx = appProperties.getWechatOpen();
    String callback =
      appProperties.getPublicBaseUrl().replaceAll("/$", "") + "/api/auth/wechat/callback";
    String redirectUri = URLEncoder.encode(callback, StandardCharsets.UTF_8);
    return "https://open.weixin.qq.com/connect/qrconnect?appid="
      + wx.getAppId()
      + "&redirect_uri="
      + redirectUri
      + "&response_type=code&scope=snsapi_login&state="
      + state
      + "#wechat_redirect";
  }

  /** 微信服务器回调：用 code 换 openid，写库并标记 poll 成功 */
  public String handleOAuthCallback(String code, String state) {
    String base = appProperties.getFrontendBaseUrl().replaceAll("/$", "");
    Pending p = pendingByPollId.get(state);
    if (p == null || System.currentTimeMillis() > p.expiresAt) {
      return base + "/wx-callback?pollId=" + state + "&reason=expired";
    }
    try {
      String openid = exchangeCodeForOpenId(code);
      if (openid == null || openid.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "微信未返回 openid。");
      }
      finishPending(p, openid);
    } catch (ResponseStatusException e) {
      p.phase = "failed";
      p.errorMessage = e.getReason() != null ? e.getReason() : "授权失败";
    } catch (Exception e) {
      log.warn("WeChat OAuth failed", e);
      p.phase = "failed";
      p.errorMessage = "微信授权失败";
    }
    return base + "/wx-callback?pollId=" + state;
  }

  private void finishPending(Pending p, String openid) {
    if ("bind".equals(p.mode)) {
      var dup = userRepo.findByWechatOpenId(openid);
      if (dup.isPresent() && !dup.get().studentId.equals(p.studentId)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "该微信已绑定其他学号。");
      }
      UserAccount u =
        userRepo.findById(p.studentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "账号不存在。"));
      u.wechatOpenId = openid;
      u.wechatBound = true;
      userRepo.save(u);
      p.phase = "success";
      p.token = jwtService.issue(u.studentId, u.role);
      p.resultStudentId = u.studentId;
    } else {
      UserAccount u =
        userRepo
          .findByWechatOpenId(openid)
          .orElseThrow(
            () ->
              new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "该微信尚未绑定学号。请在登录页填写学号与密码后选择「首次绑定并扫码」。"));
      p.phase = "success";
      p.token = jwtService.issue(u.studentId, u.role);
      p.resultStudentId = u.studentId;
    }
  }

  private String exchangeCodeForOpenId(String code) {
    var wx = appProperties.getWechatOpen();
    String uri =
      "https://api.weixin.qq.com/sns/oauth2/access_token?appid="
        + wx.getAppId()
        + "&secret="
        + wx.getAppSecret()
        + "&code="
        + URLEncoder.encode(code, StandardCharsets.UTF_8)
        + "&grant_type=authorization_code";
    String body = restClient.get().uri(uri).retrieve().body(String.class);
    try {
      JsonNode root = objectMapper.readTree(body);
      if (root.hasNonNull("errcode") && root.path("errcode").asInt() != 0) {
        throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "微信接口错误：" + root.path("errmsg").asText("unknown"));
      }
      return root.path("openid").asText(null);
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "解析微信令牌响应失败。");
    }
  }

  public Map<String, Object> poll(String pollId) {
    Pending p = pendingByPollId.get(pollId);
    if (p == null) {
      return Map.of("status", "expired", "message", "登录会话不存在或已过期。");
    }
    if (System.currentTimeMillis() > p.expiresAt) {
      pendingByPollId.remove(pollId);
      return Map.of("status", "expired", "message", "二维码已过期，请重新生成。");
    }
    if ("pending".equals(p.phase)) {
      return Map.of("status", "pending");
    }
    if ("failed".equals(p.phase)) {
      Map<String, Object> m = new HashMap<>();
      m.put("status", "failed");
      m.put("message", p.errorMessage != null ? p.errorMessage : "登录失败");
      pendingByPollId.remove(pollId);
      return m;
    }
    if ("success".equals(p.phase)) {
      UserAccount u =
        userRepo.findById(p.resultStudentId).orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "用户数据异常。"));
      Map<String, Object> m = new HashMap<>();
      m.put("status", "success");
      m.put("token", p.token);
      m.put("user", u);
      pendingByPollId.remove(pollId);
      return m;
    }
    return Map.of("status", "pending");
  }

  private static final class Pending {
    final String mode;
    final String studentId;
    final long expiresAt;
    volatile String phase = "pending";
    volatile String token;
    volatile String resultStudentId;
    volatile String errorMessage;

    private Pending(String mode, String studentId, long expiresAt) {
      this.mode = mode;
      this.studentId = studentId;
      this.expiresAt = expiresAt;
    }

    static Pending bind(String studentId, long expiresAt) {
      return new Pending("bind", studentId, expiresAt);
    }

    static Pending login(long expiresAt) {
      return new Pending("login", null, expiresAt);
    }
  }
}
