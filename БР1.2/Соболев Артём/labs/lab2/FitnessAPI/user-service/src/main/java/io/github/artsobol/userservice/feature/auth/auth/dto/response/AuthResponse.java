package io.github.artsobol.userservice.feature.auth.auth.dto.response;

public record AuthResponse(
        String accessToken, String refreshToken, UserInfo user
) {
}
