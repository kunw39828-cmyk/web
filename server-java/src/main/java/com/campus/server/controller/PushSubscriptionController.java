package com.campus.server.controller;

import com.campus.server.service.JwtService;
import com.campus.server.service.WebPushService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/push")
public class PushSubscriptionController {
  private final WebPushService webPushService;
  private final JwtService jwtService;

  public PushSubscriptionController(WebPushService webPushService, JwtService jwtService) {
    this.webPushService = webPushService;
    this.jwtService = jwtService;
  }

  @GetMapping("/vapid-public-key")
  public Map<String, String> vapidKey() {
    return Map.of("publicKey", webPushService.getVapidPublicKey());
  }

  @PostMapping("/subscribe")
  public Map<String, Boolean> subscribe(
 @RequestHeader("Authorization") String authorization, @RequestBody Map<String, Object> body) {
    if (!webPushService.isConfigured()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "服务端未配置 Web Push（VAPID）。");
    }
    String studentId = jwtService.parseStudentId(authorization);
    Object endpointObj = body.get("endpoint");
    @SuppressWarnings("unchecked")
    Map<String, String> keys = (Map<String, String>) body.get("keys");
    if (endpointObj == null || keys == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "订阅格式不正确。");
    }
    String endpoint = String.valueOf(endpointObj);
    String p256dh = keys.get("p256dh");
    String auth = keys.get("auth");
    if (endpoint.isBlank() || p256dh == null || p256dh.isBlank() || auth == null || auth.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "缺少 endpoint 或密钥。");
    }
    webPushService.saveSubscription(studentId, endpoint, p256dh, auth);
    return Map.of("ok", true);
  }

  @PostMapping("/unsubscribe")
  public Map<String, Boolean> unsubscribe(@RequestHeader("Authorization") String auth, @RequestBody Map<String, String> body) {
    String studentId = jwtService.parseStudentId(auth);
    String endpoint = body.get("endpoint");
    if (endpoint == null || endpoint.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "缺少 endpoint。");
    }
    webPushService.removeSubscription(studentId, endpoint);
    return Map.of("ok", true);
  }
}
