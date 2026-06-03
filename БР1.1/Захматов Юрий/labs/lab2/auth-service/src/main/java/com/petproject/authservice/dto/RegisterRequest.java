package com.petproject.authservice.dto;

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
