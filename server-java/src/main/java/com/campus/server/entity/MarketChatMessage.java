package com.campus.server.entity;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

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
