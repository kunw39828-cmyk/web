package com.campus.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private final Push push = new Push();

  public Push getPush() {
    return push;
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
