package com.campus.server.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "booking")
public class Booking {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  public Long id;
  public String ownerId;
  public String teacherId;
  public String venueId;
  public String venueName;
  public String applicant;
  public String date;
  public String startTime;
  public String endTime;
  public String purpose;
  public String managerTeacher;
  public String managerDepartment;
  public String status;

  public Booking() {}
}
