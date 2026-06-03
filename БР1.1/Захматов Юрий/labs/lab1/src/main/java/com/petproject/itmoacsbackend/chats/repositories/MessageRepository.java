package com.petproject.itmoacsbackend.chats.repositories;

import com.petproject.itmoacsbackend.chats.entities.MessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    Page<MessageEntity> findByChatIdIdOrderByTimestampDesc(Long chatId, Pageable pageable);

    @Query("SELECT m FROM MessageEntity m WHERE m.chatId.id = :chatId ORDER BY m.timestamp DESC")
    Page<MessageEntity> findByChatIdOrderByTimestampDesc(@Param("chatId") Long chatId, Pageable pageable);

    @Query("SELECT m FROM MessageEntity m WHERE m.chatId.id = :chatId ORDER BY m.timestamp DESC LIMIT 1")
    Optional<MessageEntity> findFirstByChatIdOrderByTimestampDesc(@Param("chatId") Long chatId);
}
