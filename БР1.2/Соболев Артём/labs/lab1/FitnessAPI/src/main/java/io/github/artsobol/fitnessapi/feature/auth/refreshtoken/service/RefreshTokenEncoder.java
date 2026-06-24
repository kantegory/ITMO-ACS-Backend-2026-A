package io.github.artsobol.fitnessapi.feature.auth.refreshtoken.service;

import io.github.artsobol.fitnessapi.config.properties.security.RefreshTokenProperties;
import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.request.CreateRefreshTokenRequest;
import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.response.CreatedRefreshToken;
import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.entity.RefreshToken;
import io.github.artsobol.fitnessapi.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class RefreshTokenEncoder {

    private final RefreshTokenProperties properties;

    @Transactional
    public CreatedRefreshToken create(CreateRefreshTokenRequest request) {

        String rawToken = TokenUtils.generateRawToken(properties.length());
        RefreshToken token = RefreshToken.create(request, hash(rawToken), calculateExpiresAt());

        return new CreatedRefreshToken(rawToken, token);
    }

    public String hash(String rawToken) {
        return TokenUtils.hmacSha256Base64Url(rawToken, properties.pepper());
    }

    private Instant calculateExpiresAt() {
        return Instant.now().plus(properties.ttl());
    }
}
