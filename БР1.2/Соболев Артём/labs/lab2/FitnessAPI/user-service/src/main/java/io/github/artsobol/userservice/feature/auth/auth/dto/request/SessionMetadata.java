package io.github.artsobol.userservice.feature.auth.auth.dto.request;

public record SessionMetadata(
        String ipAddress,
        String userAgent,
        String deviceName
) {
}
