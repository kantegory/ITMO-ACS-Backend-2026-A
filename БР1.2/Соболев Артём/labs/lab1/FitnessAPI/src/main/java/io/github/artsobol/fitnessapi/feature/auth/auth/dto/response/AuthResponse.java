package io.github.artsobol.fitnessapi.feature.auth.auth.dto.response;

public record AuthResponse(
        String accessToken, String refreshToken, UserInfo user
) {
}
