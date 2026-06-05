package io.github.artsobol.userservice.feature.auth.refreshtoken.dto.response;

import io.github.artsobol.userservice.feature.auth.refreshtoken.entity.RefreshToken;

public record CreatedRefreshToken(
        String rawToken,
        RefreshToken refreshToken
) {
}
