package com.petproject.itmoacsbackend.chats.repositories;

import com.petproject.itmoacsbackend.chats.entities.ChatEntity;
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
            "(c.user1Id.id = :userId1 AND c.user2Id.id = :userId2) OR " +
            "(c.user1Id.id = :userId2 AND c.user2Id.id = :userId1)")
    Optional<ChatEntity> findByUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Получить все чаты пользователя с пагинацией
    @Query("SELECT c FROM ChatEntity c WHERE " +
            "c.user1Id.id = :userId OR c.user2Id.id = :userId")
    Page<ChatEntity> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    // Получить количество чатов пользователя
    @Query("SELECT COUNT(c) FROM ChatEntity c WHERE " +
            "c.user1Id.id = :userId OR c.user2Id.id = :userId")
    long countByUserId(@Param("userId") Long userId);

}