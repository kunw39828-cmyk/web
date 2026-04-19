package com.campus.server.repo;

import com.campus.server.entity.Booking;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepo extends JpaRepository<Booking, Long> {
  List<Booking> findByOwnerIdOrderByIdDesc(String ownerId);
  List<Booking> findByTeacherIdInAndStatusOrderByIdDesc(List<String> teacherIds, String status);

  boolean existsByPurposeContaining(String fragment);
}
