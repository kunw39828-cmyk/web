package com.campus.server.entity;

import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Id;
import javax.persistence.Table;
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
