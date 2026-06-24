package io.github.artsobol.fitnessapi.feature.auth.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

public record RefreshTokenRequest(
        @Schema(example = "Hf5K4v2Q7m9R8s1T6u3W0x4Y2z8AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRr")
        String refreshToken
) {
}
