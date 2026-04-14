package com.campus.server.entity;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teacher_approver")
public class TeacherApprover {
  @Id
  public String id;
  public String name;
  public String department;
  @ElementCollection(fetch = FetchType.EAGER)
  public List<String> managedVenueIds = new ArrayList<>();

  public TeacherApprover() {}
}
