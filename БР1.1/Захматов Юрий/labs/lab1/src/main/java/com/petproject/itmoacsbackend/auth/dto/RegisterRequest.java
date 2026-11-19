package com.petproject.itmoacsbackend.auth.dto;

import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
        @NotNull
        String username,
        @NotNull
        String password,
        @NotNull
        String email

) {
}
