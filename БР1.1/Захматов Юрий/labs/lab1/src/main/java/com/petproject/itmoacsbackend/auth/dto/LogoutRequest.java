package com.petproject.itmoacsbackend.auth.dto;

import jakarta.validation.constraints.NotNull;

public record LogoutRequest(
        @NotNull
        String refreshToken
) {
}
