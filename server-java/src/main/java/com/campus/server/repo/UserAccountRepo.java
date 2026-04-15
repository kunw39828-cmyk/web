package com.campus.server.repo;

import com.campus.server.entity.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepo extends JpaRepository<UserAccount, String> {
  Optional<UserAccount> findFirstByName(String name);
}
