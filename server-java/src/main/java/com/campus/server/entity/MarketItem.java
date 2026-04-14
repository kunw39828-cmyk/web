package com.campus.server.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "market_item")
public class MarketItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public String title;
  public Double price;
  public String seller;
  public String sellerId;
  public String campus;

  public MarketItem() {}
}
