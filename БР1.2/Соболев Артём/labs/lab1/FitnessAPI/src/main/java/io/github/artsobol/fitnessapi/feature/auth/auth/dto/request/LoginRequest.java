package io.github.artsobol.fitnessapi.feature.auth.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @Size(max = 64, message = "auth.user.username.long")
        @NotBlank(message = "auth.user.username.blank")
        String username,

        @NotBlank(message = "auth.user.password.blank")
        String password
) {
}

