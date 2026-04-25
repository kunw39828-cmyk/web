package com.campus.server.entity;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

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
