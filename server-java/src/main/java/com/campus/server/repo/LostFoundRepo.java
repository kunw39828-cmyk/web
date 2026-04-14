package com.campus.server.repo;

import com.campus.server.entity.LostFoundItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LostFoundRepo extends JpaRepository<LostFoundItem, Long> {
  boolean existsByTitle(String title);
}
