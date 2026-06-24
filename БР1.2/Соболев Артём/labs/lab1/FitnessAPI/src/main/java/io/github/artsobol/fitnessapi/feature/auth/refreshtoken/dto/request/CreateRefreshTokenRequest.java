package io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.request;


import io.github.artsobol.fitnessapi.feature.user.entity.User;

import java.util.UUID;

public record CreateRefreshTokenRequest(
        User user,
        UUID sessionId,
        String ipAddress,
        String userAgent,
        String deviceName
) {
}
