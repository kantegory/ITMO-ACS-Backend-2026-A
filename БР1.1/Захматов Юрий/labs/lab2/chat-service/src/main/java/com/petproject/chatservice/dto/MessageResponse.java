package com.petproject.chatservice.dto;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long senderId,
        String content,
        LocalDateTime createdAt
) {
}
