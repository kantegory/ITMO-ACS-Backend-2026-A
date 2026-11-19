package com.petproject.itmoacsbackend.auth.dto;


import jakarta.validation.constraints.NotNull;

public record AuthRequest(
        @NotNull
        String username,
        @NotNull
        String password
) {}
