package com.petproject.chatservice.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ChatResponse(
        Long chatId,
        Long otherUserId,
        String otherUserName,

        String lastMessage,

        LocalDateTime lastMessageTime
) {
}
