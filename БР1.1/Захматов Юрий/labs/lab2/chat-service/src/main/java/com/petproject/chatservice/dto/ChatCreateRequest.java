package com.petproject.chatservice.dto;

import jakarta.validation.constraints.NotNull;

public record ChatCreateRequest(
        @NotNull
        Long user_toChat
) {
}
