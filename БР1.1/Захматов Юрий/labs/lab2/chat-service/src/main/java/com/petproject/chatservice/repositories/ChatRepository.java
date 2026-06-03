package com.petproject.chatservice.repositories;

import com.petproject.chatservice.entities.ChatEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<ChatEntity, Long> {

    @Query("SELECT c FROM ChatEntity c WHERE " +
            "(c.user1Id = :userId1 AND c.user2Id = :userId2) OR " +
            "(c.user1Id = :userId2 AND c.user2Id = :userId1)")
    Optional<ChatEntity> findByUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Получить все чаты пользователя с пагинацией
    @Query("SELECT c FROM ChatEntity c WHERE c.user1Id = :userId OR c.user2Id = :userId")
    Page<ChatEntity> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    // Получить количество чатов пользователя
    @Query("SELECT COUNT(c) FROM ChatEntity c WHERE " +
            "c.user1Id = :userId OR c.user2Id = :userId")
    long countByUserId(@Param("userId") Long userId);

}