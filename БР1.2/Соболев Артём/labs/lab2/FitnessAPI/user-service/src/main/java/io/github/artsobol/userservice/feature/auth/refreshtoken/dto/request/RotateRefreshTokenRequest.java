package io.github.artsobol.userservice.feature.auth.refreshtoken.dto.request;

public record RotateRefreshTokenRequest(
        String rawRefreshToken,
        String ipAddress,
        String userAgent
) {
}
