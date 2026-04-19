package com.campus.server.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "venue")
public class Venue {
  @Id
  public String id;
  public String name;
  public String building;
  public String open;
  public Integer seats;

  public Venue() {}
}
