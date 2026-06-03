package com.petproject.authservice.dto;

import jakarta.validation.constraints.NotNull;

public record LogoutRequest(
        @NotNull
        String refreshToken
) {
}
