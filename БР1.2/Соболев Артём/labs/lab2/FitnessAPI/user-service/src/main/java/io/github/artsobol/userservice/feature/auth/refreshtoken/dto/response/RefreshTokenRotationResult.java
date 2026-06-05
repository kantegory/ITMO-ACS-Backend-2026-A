package io.github.artsobol.userservice.feature.auth.refreshtoken.dto.response;

import io.github.artsobol.userservice.feature.user.entity.User;

import java.util.UUID;

public record RefreshTokenRotationResult(
        User user,
        String rawRefreshToken,
        UUID sessionId
) {
}
