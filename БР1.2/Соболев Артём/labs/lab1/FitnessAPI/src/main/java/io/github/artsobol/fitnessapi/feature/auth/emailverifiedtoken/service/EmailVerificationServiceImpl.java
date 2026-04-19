package io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.service;

import io.github.artsobol.fitnessapi.config.properties.security.EmailVerificationTokenTokenProperties;
import io.github.artsobol.fitnessapi.exception.http.NotFoundException;
import io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.entity.EmailVerificationToken;
import io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.repository.EmailVerificationRepository;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.utils.TokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private final EmailVerificationRepository emailVerificationTokenRepository;
    private final EmailVerificationTokenTokenProperties EmailVerificationTokenProperties;

    @Override
    @Transactional
    public String createVerificationToken(User user) {
        revokeUserActiveToken(user.getId());

        String rawToken = TokenUtils.generateRawToken(EmailVerificationTokenProperties.length());
        String tokenHash = TokenUtils.hmacSha256Base64Url(rawToken, EmailVerificationTokenProperties.pepper());

        EmailVerificationToken entity = EmailVerificationToken.create(user, tokenHash, calculateExpiresAt());
        emailVerificationTokenRepository.save(entity);

        return rawToken;
    }

    @Override
    @Transactional(readOnly = true)
    public void validateToken(String rawToken) {
        String tokenHash = TokenUtils.hmacSha256Base64Url(rawToken, EmailVerificationTokenProperties.pepper());

        emailVerificationTokenRepository.findActiveTokenByTokenHash(tokenHash)
                .orElseThrow(() -> new NotFoundException("{email.verification.token.not.found}"));
    }

    @Override
    @Transactional
    public void verifyEmail(String rawToken) {
        String tokenHash = TokenUtils.hmacSha256Base64Url(rawToken, EmailVerificationTokenProperties.pepper());

        EmailVerificationToken token = emailVerificationTokenRepository.findActiveTokenByTokenHash(tokenHash)
                .orElseThrow(() -> new NotFoundException("{email.verification.token.not.found}"));

        User user = token.getUser();
        user.verifyEmail();

        token.setUsedAt(Instant.now());
    }

    private void revokeUserActiveToken(Long userId) {
        emailVerificationTokenRepository.findActiveTokenByUserId(userId)
                .ifPresent(emailVerificationToken -> emailVerificationToken.setRevokedAt(Instant.now()));
    }

    private Instant calculateExpiresAt() {
        return Instant.now().plus(EmailVerificationTokenProperties.ttl());
    }
}
