package io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.service;

import io.github.artsobol.fitnessapi.config.properties.security.PasswordResetTokenProperties;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.entity.PasswordResetToken;
import io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.repository.PasswordResetTokenRepository;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PasswordResetTokenServiceImpl implements PasswordResetTokenService {

    private final PasswordResetTokenProperties passwordResetTokenProperties;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public String createResetToken(User user) {
        revokeUserActiveToken(user.getId());

        String rawToken = TokenUtils.generateRawToken(passwordResetTokenProperties.length());
        String tokenHash = TokenUtils.hmacSha256Base64Url(rawToken, passwordResetTokenProperties.pepper());

        PasswordResetToken entity = PasswordResetToken.create(user, tokenHash, calculateExpiresAt());
        passwordResetTokenRepository.save(entity);

        return rawToken;
    }

    @Override
    @Transactional(readOnly = true)
    public void validateToken(String rawToken) {
        String tokenHash = TokenUtils.hmacSha256Base64Url(rawToken, passwordResetTokenProperties.pepper());

        passwordResetTokenRepository.findActiveTokenByTokenHash(tokenHash)
                .orElseThrow(() -> new NotFoundException("{password.reset.token.not.found}"));
    }

    @Override
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = TokenUtils.hmacSha256Base64Url(rawToken, passwordResetTokenProperties.pepper());

        PasswordResetToken token = passwordResetTokenRepository.findActiveTokenByTokenHash(tokenHash)
                .orElseThrow(() -> new NotFoundException("{password.reset.token.not.found}"));
        User user = token.getUser();
        user.changePasswordHash(passwordEncoder.encode(newPassword));

        token.setUsedAt(Instant.now());
    }

    private void revokeUserActiveToken(Long userId) {
        passwordResetTokenRepository.findActiveTokenByUserId(userId)
                .ifPresent(passwordResetToken -> passwordResetToken.setRevokedAt(Instant.now()));
    }

    private Instant calculateExpiresAt() {
        return Instant.now().plus(passwordResetTokenProperties.ttl());
    }
}
