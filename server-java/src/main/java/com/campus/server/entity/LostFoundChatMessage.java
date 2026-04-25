package com.campus.server.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

@Entity
@Table(name = "lost_found_chat_message")
public class LostFoundChatMessage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;

  @Column(name = "lost_found_item_id", nullable = false)
  public Long lostFoundItemId;

  @Column(name = "from_id", nullable = false, length = 64)
  public String fromId;

  @Column(name = "to_id", nullable = false, length = 64)
  public String toId;

  @Lob
  @Column(nullable = false)
  public String content;

  @Column(name = "created_at", nullable = false, length = 32)
  public String createdAt;

  @Column(name = "read_flag", nullable = false)
  public boolean readFlag;

  @Column(name = "message_type", nullable = false, length = 16)
  public String messageType;

  @Column(name = "deleted_flag", nullable = false)
  public boolean deletedFlag;

  public LostFoundChatMessage() {}
}
