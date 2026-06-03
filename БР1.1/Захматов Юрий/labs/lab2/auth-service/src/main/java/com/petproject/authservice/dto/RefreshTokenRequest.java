package com.petproject.authservice.dto;

import jakarta.validation.constraints.NotNull;

public record RefreshTokenRequest(
        @NotNull
        String refreshToken
) {
}
