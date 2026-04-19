package com.campus.server.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PostLoad;
import jakarta.persistence.Table;

@Entity
@Table(name = "lost_found_item")
public class LostFoundItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public String title;
  public String place;
  public String date;
  public String status;
  /** 寻物=丢失寻找；招领=捡到招领 */
  public String kind;

  @Lob
  public String imageUrl;

  /** 发布者学号，对应 {@code user_account.student_id}，仅服务端根据登录态写入 */
  public String publisherId;

  /** 发布者展示名（与账号一致，含学生/老师后缀） */
  public String publisherName;

  public LostFoundItem() {}

  @PostLoad
  void normalizeKind() {
    if (kind == null || kind.isBlank()) {
      kind = "寻物";
    }
  }
}
