package com.campus.server.repo;

import com.campus.server.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenueRepo extends JpaRepository<Venue, String> {}
