package io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.response;

import io.github.artsobol.fitnessapi.feature.user.entity.User;

import java.util.UUID;

public record RefreshTokenRotationResult(
        User user,
        String rawRefreshToken,
        UUID sessionId
) {
}
