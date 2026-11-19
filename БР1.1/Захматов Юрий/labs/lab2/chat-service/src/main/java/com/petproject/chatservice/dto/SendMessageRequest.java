package com.petproject.chatservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @NotBlank(message = "Message content cannot be blank")
        @Size(max = 2000, message = "Message too long")
        String content
) {
}
