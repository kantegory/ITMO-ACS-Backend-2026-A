package io.github.artsobol.userservice.feature.auth.refreshtoken.service;

import io.github.artsobol.common.config.properties.security.SessionProperties;
import io.github.artsobol.common.exception.security.AuthenticationException;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.request.CreateRefreshTokenRequest;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.request.RotateRefreshTokenRequest;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.response.CreatedRefreshToken;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.response.RefreshTokenRotationResult;
import io.github.artsobol.userservice.feature.auth.refreshtoken.entity.RefreshToken;
import io.github.artsobol.userservice.feature.auth.refreshtoken.entity.RevokedReason;
import io.github.artsobol.userservice.feature.auth.refreshtoken.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenEncoder encoder;
    private final SessionProperties properties;

    @Override
    @Transactional
    public String createRefreshToken(CreateRefreshTokenRequest request) {
        log.info("Creating refresh token userId={}", request.user().getId());
        Long id = request.user().getId();
        long activeSessions = refreshTokenRepository.countActiveSessions(id);
        ensureHasSessions(id, activeSessions);
        CreatedRefreshToken encoded = encoder.create(request);
        refreshTokenRepository.save(encoded.refreshToken());

        log.info("Refresh token created userId={}", request.user().getId());
        return encoded.rawToken();
    }

    @Override
    @Transactional
    public RefreshTokenRotationResult rotate(RotateRefreshTokenRequest request) {
        log.info("Rotating refresh token");
        if (!StringUtils.hasText(request.rawRefreshToken())) {
            throw new AuthenticationException("auth.refresh.invalid");
        }

        String hash = encoder.hash(request.rawRefreshToken());
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new AuthenticationException("auth.refresh.invalid"));

        if (token.isExpiredAt(Instant.now())) {
            throw new AuthenticationException("auth.refresh.expired");
        }

        if (token.isRevoked()) {
            throw new AuthenticationException("auth.refresh.revoked");
        }

        CreateRefreshTokenRequest refreshTokenRequest = new CreateRefreshTokenRequest(
                token.getUser(),
                token.getSessionId(),
                request.ipAddress(),
                request.userAgent(),
                token.getDeviceName()
        );
        CreatedRefreshToken encoded = encoder.create(refreshTokenRequest);
        RefreshToken newToken = encoded.refreshToken();

        token.replaceWith(newToken, Instant.now());

        refreshTokenRepository.save(newToken);

        log.info("Refresh token rotated");
        return new RefreshTokenRotationResult(token.getUser(), encoded.rawToken(), token.getSessionId());
    }

    @Override
    @Transactional
    public void revoke(String rawRefreshToken) {
        if (!StringUtils.hasText(rawRefreshToken)) {
            log.debug("Logout requested without refresh token");
            return;
        }

        log.info("Revoking refresh token");
        String hash = encoder.hash(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash)
                .ifPresent(token -> revokeSession(token.getUser().getId(), token.getSessionId(), Instant.now()));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSessionActive(Long userId, UUID sessionId) {
        return refreshTokenRepository.countActiveByUserIdAndSessionId(userId, sessionId) > 0;
    }

    private void ensureHasSessions(Long userId, long sessionsCount) {
        if (sessionsCount >= properties.maxSessions()) {
            log.info("User: {} has too many active sessions={}, revoking oldest one", userId, sessionsCount);
            RefreshToken token = refreshTokenRepository.findOldestActiveSessions(userId, PageRequest.of(0, 1))
                    .getFirst();
            refreshTokenRepository.revokeSessionByUserIdAndSessionId(userId, token.getSessionId());
        }
    }

    private void revokeSession(Long userId, UUID sessionId, Instant now) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findActiveByUserIdAndSessionId(userId, sessionId);
        if (activeTokens.isEmpty()) {
            log.debug("Refresh session already inactive userId={} sessionId={}", userId, sessionId);
            return;
        }

        activeTokens.forEach(token -> token.revoke(now, RevokedReason.LOGOUT));
        log.info("Refresh session revoked userId={} sessionId={}", userId, sessionId);
    }
}
