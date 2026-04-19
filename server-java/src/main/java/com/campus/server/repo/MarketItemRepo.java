package com.campus.server.repo;

import com.campus.server.entity.MarketItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketItemRepo extends JpaRepository<MarketItem, Long> {
  boolean existsByTitleAndSeller(String title, String seller);
}
