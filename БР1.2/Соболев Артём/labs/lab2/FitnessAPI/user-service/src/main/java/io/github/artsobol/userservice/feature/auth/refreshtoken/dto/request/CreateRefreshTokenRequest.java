package io.github.artsobol.userservice.feature.auth.refreshtoken.dto.request;


import io.github.artsobol.userservice.feature.user.entity.User;

import java.util.UUID;

public record CreateRefreshTokenRequest(
        User user,
        UUID sessionId,
        String ipAddress,
        String userAgent,
        String deviceName
) {
}
