package com.campus.server.repo;

import com.campus.server.entity.TeacherApprover;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepo extends JpaRepository<TeacherApprover, String> {
  List<TeacherApprover> findByManagedVenueIdsContaining(String venueId);
  List<TeacherApprover> findByName(String name);
}
