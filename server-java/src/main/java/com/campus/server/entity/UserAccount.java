package com.campus.server.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "user_account")
public class UserAccount {
  @Id
  public String studentId;
  public String name;
  public String role;
  public String department;

  /** 身份证后四位（仅用于忘记密码校验） */
  @JsonIgnore
  @Column(name = "id_card_last4", length = 4)
  public String idCardLast4;

  /** 首次登录后需修改学校配发密码 */
  public boolean mustChangePassword = true;

  @JsonIgnore
  public String password;

  public UserAccount() {}
}
