package com.campus.server.repo;

import com.campus.server.entity.NewsItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsItemRepo extends JpaRepository<NewsItem, Long> {
  boolean existsByTitle(String title);
}
