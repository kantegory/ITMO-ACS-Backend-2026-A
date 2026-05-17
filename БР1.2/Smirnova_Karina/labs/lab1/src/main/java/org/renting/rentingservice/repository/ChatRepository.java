package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.ChatEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatRepository extends JpaRepository<ChatEntity, Long> {

    Optional<ChatEntity> findByUser1IdAndUser2Id(Long user1Id, Long user2Id);

    @Query("""
            SELECT c FROM ChatEntity c
            WHERE c.user1.id = :userId OR c.user2.id = :userId
            ORDER BY c.createdAt DESC
            """)
    Page<ChatEntity> findByParticipant(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM ChatEntity c
            WHERE c.id = :chatId AND (c.user1.id = :userId OR c.user2.id = :userId)
            """)
    boolean isParticipant(@Param("chatId") Long chatId, @Param("userId") Long userId);
}
