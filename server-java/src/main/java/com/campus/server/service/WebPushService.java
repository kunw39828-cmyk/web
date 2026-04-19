package com.campus.server.service;

import com.campus.server.config.AppProperties;
import com.campus.server.entity.LostFoundChatMessage;
import com.campus.server.entity.LostFoundItem;
import com.campus.server.entity.MarketChatMessage;
import com.campus.server.entity.MarketItem;
import com.campus.server.entity.PushSubscriptionEntity;
import com.campus.server.entity.UserAccount;
import com.campus.server.repo.PushSubscriptionRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class WebPushService {
  private static final Logger log = LoggerFactory.getLogger(WebPushService.class);

  private final AppProperties appProperties;
  private final PushSubscriptionRepo subscriptionRepo;
  private final ObjectMapper objectMapper;
  private volatile PushService pushService;

  public WebPushService(AppProperties appProperties, PushSubscriptionRepo subscriptionRepo, ObjectMapper objectMapper) {
    this.appProperties = appProperties;
    this.subscriptionRepo = subscriptionRepo;
    this.objectMapper = objectMapper;
  }

  public boolean isConfigured() {
    var p = appProperties.getPush();
    return p.getVapidPublicKey() != null
      && !p.getVapidPublicKey().isBlank()
      && p.getVapidPrivateKey() != null
      && !p.getVapidPrivateKey().isBlank();
  }

  public String getVapidPublicKey() {
    var k = appProperties.getPush().getVapidPublicKey();
    return k == null ? "" : k;
  }

  private PushService service() throws Exception {
    if (pushService == null && isConfigured()) {
      synchronized (this) {
        if (pushService == null) {
          var p = appProperties.getPush();
          pushService = new PushService(p.getVapidPublicKey(), p.getVapidPrivateKey(), p.getVapidSubject());
        }
      }
    }
    return pushService;
  }

  public void saveSubscription(String studentId, String endpoint, String p256dh, String authKey) {
    subscriptionRepo.deleteByUserStudentIdAndEndpoint(studentId, endpoint);
    PushSubscriptionEntity e = new PushSubscriptionEntity();
    e.userStudentId = studentId;
    e.endpoint = endpoint;
    e.p256dh = p256dh;
    e.auth = authKey;
    subscriptionRepo.save(e);
  }

  public void removeSubscription(String studentId, String endpoint) {
    subscriptionRepo.deleteByUserStudentIdAndEndpoint(studentId, endpoint);
  }

  public void notifyMarketMessage(MarketChatMessage msg, UserAccount sender, MarketItem item) {
    if (!isConfigured()) {
      return;
    }
    try {
      PushService ps = service();
      if (ps == null) {
        return;
      }
      String title = "二手消息 · " + (sender != null ? sender.name : "同学");
      String body =
        ("image".equals(msg.messageType) ? "[图片] " : "")
          + (item != null ? item.title : "商品咨询");
      Map<String, Object> payload = new HashMap<>();
      payload.put("title", title);
      payload.put("body", body);
      Map<String, String> data = new HashMap<>();
      data.put("url", "/market/chat?itemId=" + msg.itemId + "&sellerId=" + msg.fromId + "&title=" + enc(item != null ? item.title : "") + "&seller=" + enc(sender != null ? sender.name : ""));
      payload.put("data", data);
      String json = objectMapper.writeValueAsString(payload);
      for (PushSubscriptionEntity sub : subscriptionRepo.findByUserStudentId(msg.toId)) {
        try {
          Subscription s = new Subscription(sub.endpoint, new Subscription.Keys(sub.p256dh, sub.auth));
          Notification n = new Notification(s, json);
          HttpResponse res = ps.send(n);
          int code = res.getStatusLine().getStatusCode();
          if (code == 404 || code == 410) {
            subscriptionRepo.delete(sub);
          }
        } catch (Exception ex) {
          log.debug("Push to {} failed: {}", sub.endpoint, ex.getMessage());
        }
      }
    } catch (Exception e) {
      log.warn("Web push batch failed: {}", e.getMessage());
    }
  }

  public void notifyLostFoundMessage(LostFoundChatMessage msg, UserAccount sender, LostFoundItem post) {
    if (!isConfigured()) {
      return;
    }
    try {
      PushService ps = service();
      if (ps == null) {
        return;
      }
      String title = "失物招领 · " + (sender != null ? sender.name : "同学");
      String body =
        ("image".equals(msg.messageType) ? "[图片] " : "")
          + (post != null ? post.title : "启事咨询");
      Map<String, Object> payload = new HashMap<>();
      payload.put("title", title);
      payload.put("body", body);
      Map<String, String> data = new HashMap<>();
      data.put(
        "url",
        "/lost-found/chat?itemId="
          + msg.lostFoundItemId
          + "&sellerId="
          + msg.fromId
          + "&title="
          + enc(post != null ? post.title : "")
          + "&seller="
          + enc(sender != null ? sender.name : ""));
      payload.put("data", data);
      String json = objectMapper.writeValueAsString(payload);
      for (PushSubscriptionEntity sub : subscriptionRepo.findByUserStudentId(msg.toId)) {
        try {
          Subscription s = new Subscription(sub.endpoint, new Subscription.Keys(sub.p256dh, sub.auth));
          Notification n = new Notification(s, json);
          HttpResponse res = ps.send(n);
          int code = res.getStatusLine().getStatusCode();
          if (code == 404 || code == 410) {
            subscriptionRepo.delete(sub);
          }
        } catch (Exception ex) {
          log.debug("Push to {} failed: {}", sub.endpoint, ex.getMessage());
        }
      }
    } catch (Exception e) {
      log.warn("Web push (lost-found) failed: {}", e.getMessage());
    }
  }

  private static String enc(String s) {
    if (s == null) {
      return "";
    }
    return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8);
  }
}
