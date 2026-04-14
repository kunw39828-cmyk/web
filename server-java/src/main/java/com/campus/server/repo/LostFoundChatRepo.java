package com.campus.server.repo;

import com.campus.server.entity.LostFoundChatMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LostFoundChatRepo extends JpaRepository<LostFoundChatMessage, Long> {
  @Query(
    "select m from LostFoundChatMessage m where m.lostFoundItemId = :itemId and "
      + "((m.fromId = :a and m.toId = :b) or (m.fromId = :b and m.toId = :a)) "
      + "order by m.id asc")
  List<LostFoundChatMessage> findConversation(
    @Param("itemId") Long itemId, @Param("a") String a, @Param("b") String b);

  List<LostFoundChatMessage> findByFromIdOrToIdOrderByIdDesc(String fromId, String toId);
}
