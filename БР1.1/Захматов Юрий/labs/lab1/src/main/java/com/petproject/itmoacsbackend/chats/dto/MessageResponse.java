package com.petproject.itmoacsbackend.chats.dto;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long senderId,
        String content,
        LocalDateTime createdAt
) {
}
