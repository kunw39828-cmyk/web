package com.campus.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "push_subscription")
public class PushSubscriptionEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "user_student_id", nullable = false, length = 64)
  public String userStudentId;

  @Column(nullable = false, length = 512)
  public String endpoint;

  @Column(nullable = false, length = 256)
  public String p256dh;

  @Column(nullable = false, length = 128)
  public String auth;

  public PushSubscriptionEntity() {}
}
