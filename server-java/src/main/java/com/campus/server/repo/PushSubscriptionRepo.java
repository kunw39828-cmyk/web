package com.campus.server.repo;

import com.campus.server.entity.PushSubscriptionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepo extends JpaRepository<PushSubscriptionEntity, Long> {
  List<PushSubscriptionEntity> findByUserStudentId(String userStudentId);

  void deleteByUserStudentIdAndEndpoint(String userStudentId, String endpoint);
}
