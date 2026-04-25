package com.campus.server.entity;

import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
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
