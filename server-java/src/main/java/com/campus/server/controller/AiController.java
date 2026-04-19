package com.campus.server.controller;

import com.campus.server.service.AiChatService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ai")
public class AiController {
  private final AiChatService aiChatService;

  public AiController(AiChatService aiChatService) {
    this.aiChatService = aiChatService;
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    return aiChatService.status();
  }

  @PostMapping("/chat")
  public Map<String, String> chat(@RequestBody Map<String, String> body) {
    String message = body == null ? "" : body.getOrDefault("message", "").trim();
    if (message.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息不能为空。");
    }
    if (message.length() > 8000) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息过长，请缩短后再试。");
    }
    return Map.of("reply", aiChatService.chat(message));
  }
}
