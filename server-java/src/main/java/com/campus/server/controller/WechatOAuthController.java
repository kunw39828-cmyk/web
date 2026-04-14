package com.campus.server.controller;

import com.campus.server.service.WechatOpenAuthService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;

@Controller
@RequestMapping("/api/auth/wechat")
public class WechatOAuthController {
  private final WechatOpenAuthService wechatOpenAuthService;

  public WechatOAuthController(WechatOpenAuthService wechatOpenAuthService) {
    this.wechatOpenAuthService = wechatOpenAuthService;
  }

  @GetMapping("/callback")
  public RedirectView callback(@RequestParam String code, @RequestParam String state) {
    String target = wechatOpenAuthService.handleOAuthCallback(code, state);
    return new RedirectView(target);
  }
}
