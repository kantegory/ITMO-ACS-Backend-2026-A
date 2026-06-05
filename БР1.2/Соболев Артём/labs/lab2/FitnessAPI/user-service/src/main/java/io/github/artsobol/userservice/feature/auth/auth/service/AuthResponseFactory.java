package io.github.artsobol.userservice.feature.auth.auth.service;

import io.github.artsobol.userservice.feature.auth.auth.dto.response.AuthResponse;
import io.github.artsobol.userservice.feature.auth.auth.dto.response.UserInfo;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.request.CreateRefreshTokenRequest;
import io.github.artsobol.userservice.feature.auth.refreshtoken.service.RefreshTokenService;
import io.github.artsobol.userservice.feature.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthResponseFactory {

    private final AccessTokenService accessTokenService;
    private final RefreshTokenService refreshTokenService;

    public AuthResponse create(CreateRefreshTokenRequest request) {
        log.info("Creating auth response userId={}", request.user().getId());
        User user = request.user();
        AuthResponse response = new AuthResponse(
                accessTokenService.createAccessToken(user, request.sessionId()),
                refreshTokenService.createRefreshToken(request),
                new UserInfo(user.getId(), user.getUsername(), user.getRole())
        );

        log.info("Auth response created userId={}", user.getId());
        return response;
    }

    public AuthResponse createWithRefresh(User user, String rawRefreshToken, java.util.UUID sessionId) {
        log.info("Creating auth response with refresh token userId={}", user.getId());
        AuthResponse response = new AuthResponse(
                accessTokenService.createAccessToken(user, sessionId),
                rawRefreshToken,
                new UserInfo(user.getId(), user.getUsername(), user.getRole())
        );

        log.info("Auth response with refresh token created userId={}", user.getId());
        return response;
    }
}
