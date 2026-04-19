package io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.response;

import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.entity.RefreshToken;

public record CreatedRefreshToken(
        String rawToken,
        RefreshToken refreshToken
) {
}
