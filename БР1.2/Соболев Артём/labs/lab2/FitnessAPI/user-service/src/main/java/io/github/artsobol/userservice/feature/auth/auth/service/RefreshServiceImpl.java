package io.github.artsobol.userservice.feature.auth.auth.service;

import io.github.artsobol.userservice.feature.auth.auth.dto.response.AuthResponse;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.request.RotateRefreshTokenRequest;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.response.RefreshTokenRotationResult;
import io.github.artsobol.userservice.feature.auth.refreshtoken.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshServiceImpl implements RefreshService {

    private final RefreshTokenService refreshTokenService;
    private final AuthResponseFactory authResponseFactory;

    @Override
    @Transactional
    public AuthResponse refresh(RotateRefreshTokenRequest request) {
        log.info("Requesting to refresh token");
        RefreshTokenRotationResult rotated = refreshTokenService.rotate(request);
        return authResponseFactory.createWithRefresh(rotated.user(), rotated.rawRefreshToken(), rotated.sessionId());
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        log.info("Requesting logout");
        refreshTokenService.revoke(rawRefreshToken);
    }
}
