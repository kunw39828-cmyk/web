package com.campus.server.controller;

import com.campus.server.service.WechatOpenAuthService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/wechat")
public class WechatAuthRestController {
  private final WechatOpenAuthService wechatOpenAuthService;

  public WechatAuthRestController(WechatOpenAuthService wechatOpenAuthService) {
    this.wechatOpenAuthService = wechatOpenAuthService;
  }

  @GetMapping("/capabilities")
  public Map<String, Object> capabilities() {
    return wechatOpenAuthService.capabilities();
  }

  @PostMapping("/open/init")
  public Map<String, Object> openInit(@RequestBody(required = false) Map<String, String> body) {
    String sid = body != null ? body.get("studentId") : null;
    String pwd = body != null ? body.get("password") : null;
    return wechatOpenAuthService.openInit(sid, pwd);
  }

  @GetMapping("/open/poll")
  public Map<String, Object> openPoll(@RequestParam String pollId) {
    return wechatOpenAuthService.poll(pollId);
  }
}
