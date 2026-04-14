package com.campus.server.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_account")
public class UserAccount {
  @Id
  public String studentId;
  public String name;
  public String role;
  public String department;
  public boolean wechatBound;

  /** 微信开放平台网站应用 OpenID，用于扫码登录 */
  @Column(name = "wechat_open_id", unique = true, length = 128)
  public String wechatOpenId;

  @JsonIgnore
  public String password;

  public UserAccount() {}
}
