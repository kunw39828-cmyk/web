package com.campus.server.repo;

import com.campus.server.entity.MarketChatMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MarketChatRepo extends JpaRepository<MarketChatMessage, Long> {
  @Query(
    "select m from MarketChatMessage m where m.itemId = :itemId and "
      + "((m.fromId = :a and m.toId = :b) or (m.fromId = :b and m.toId = :a)) "
      + "order by m.id asc")
  List<MarketChatMessage> findConversation(@Param("itemId") Long itemId, @Param("a") String a, @Param("b") String b);

  List<MarketChatMessage> findByFromIdOrToIdOrderByIdDesc(String fromId, String toId);
}
