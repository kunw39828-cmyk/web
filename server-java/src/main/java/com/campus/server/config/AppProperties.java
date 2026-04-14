package com.campus.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
  /** 前端 SPA 地址，用于微信 OAuth 完成后 iframe 内跳转 */
  private String frontendBaseUrl = "http://localhost:5173";
  /** 本服务对外可访问的根 URL（与微信开放平台「授权回调域」一致），用于拼 redirect_uri */
  private String publicBaseUrl = "http://localhost:3000";
  private final WechatOpen wechatOpen = new WechatOpen();
  private final Push push = new Push();

  public String getFrontendBaseUrl() {
    return frontendBaseUrl;
  }

  public void setFrontendBaseUrl(String frontendBaseUrl) {
    this.frontendBaseUrl = frontendBaseUrl;
  }

  public String getPublicBaseUrl() {
    return publicBaseUrl;
  }

  public void setPublicBaseUrl(String publicBaseUrl) {
    this.publicBaseUrl = publicBaseUrl;
  }

  public WechatOpen getWechatOpen() {
    return wechatOpen;
  }

  public Push getPush() {
    return push;
  }

  public static class WechatOpen {
    private boolean enabled;
    private String appId = "";
    private String appSecret = "";

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public String getAppId() {
      return appId;
    }

    public void setAppId(String appId) {
      this.appId = appId;
    }

    public String getAppSecret() {
      return appSecret;
    }

    public void setAppSecret(String appSecret) {
      this.appSecret = appSecret;
    }
  }

  public static class Push {
    private String vapidPublicKey = "";
    private String vapidPrivateKey = "";
    private String vapidSubject = "mailto:noreply@localhost";

    public String getVapidPublicKey() {
      return vapidPublicKey;
    }

    public void setVapidPublicKey(String vapidPublicKey) {
      this.vapidPublicKey = vapidPublicKey;
    }

    public String getVapidPrivateKey() {
      return vapidPrivateKey;
    }

    public void setVapidPrivateKey(String vapidPrivateKey) {
      this.vapidPrivateKey = vapidPrivateKey;
    }

    public String getVapidSubject() {
      return vapidSubject;
    }

    public void setVapidSubject(String vapidSubject) {
      this.vapidSubject = vapidSubject;
    }
  }
}
