package com.campus.server.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "market_chat_message")
public class MarketChatMessage {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public Long itemId;
  public String fromId;
  public String toId;
  @Lob
  public String content;
  public String createdAt;
  public boolean readFlag;
  public String messageType;
  public boolean deletedFlag;

  public MarketChatMessage() {}
}
