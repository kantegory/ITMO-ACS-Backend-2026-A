package com.petproject.itmoacsbackend.chats.dto;

import jakarta.validation.constraints.NotNull;

public record ChatCreateRequest(
        @NotNull
        Long user_toChat
) {
}
