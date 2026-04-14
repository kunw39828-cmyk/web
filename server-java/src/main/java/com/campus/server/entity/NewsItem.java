package com.campus.server.entity;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "news_item")
public class NewsItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public String title;
  public String date;
  public String tag;
  public String summary;
  public String author;
  @ElementCollection(fetch = FetchType.EAGER)
  public List<String> imageUrls = new ArrayList<>();

  public NewsItem() {}
}
