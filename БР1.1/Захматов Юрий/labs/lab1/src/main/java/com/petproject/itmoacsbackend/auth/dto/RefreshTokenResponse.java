package com.petproject.itmoacsbackend.auth.dto;

import lombok.Builder;

@Builder
public record RefreshTokenResponse(
        String accessToken,
        String refreshToken
) {
}
