package org.renting.rentingservice.service;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.config.AppProperties;
import org.renting.rentingservice.domain.entity.EmailVerificationTokenEntity;
import org.renting.rentingservice.domain.entity.RefreshTokenEntity;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.dto.auth.*;
import org.renting.rentingservice.exception.ConflictException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.exception.UnauthorizedException;
import org.renting.rentingservice.repository.EmailVerificationTokenRepository;
import org.renting.rentingservice.repository.RefreshTokenRepository;
import org.renting.rentingservice.repository.UserRepository;
import org.renting.rentingservice.security.JwtTokenProvider;
import org.renting.rentingservice.util.TokenHashUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Profile("user")
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final AppProperties appProperties;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }
        UserEntity user = UserEntity.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .verified(false)
                .build();
        user = userRepository.save(user);
        issueVerificationToken(user);
        return RegisterResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .phone(user.getPhone())
                .verified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public TokensResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        return issueTokens(user);
    }

    @Transactional
    public TokensResponse refresh(RefreshRequest request) {
        Claims claims;
        try {
            claims = jwtTokenProvider.parseClaims(request.getRefreshToken());
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        if (!jwtTokenProvider.isRefreshToken(claims)) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        String hash = TokenHashUtils.sha256(request.getRefreshToken());
        RefreshTokenEntity stored = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash)
                .orElseThrow(() -> new UnauthorizedException("Refresh token revoked or not found"));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }
        UserEntity user = stored.getUser();
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);
        return issueTokens(user);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        String hash = TokenHashUtils.sha256(request.getRefreshToken());
        refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void confirmEmail(EmailConfirmRequest request) {
        String hash = TokenHashUtils.sha256(request.getToken());
        EmailVerificationTokenEntity token = emailVerificationTokenRepository.findByTokenHashAndUsedAtIsNull(hash)
                .orElseThrow(() -> new NotFoundException("Verification token not found"));
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ConflictException("Verification token expired");
        }
        if (token.getUser().isVerified()) {
            throw new ConflictException("Email already verified");
        }
        UserEntity user = token.getUser();
        user.setVerified(true);
        userRepository.save(user);
        token.setUsedAt(Instant.now());
        emailVerificationTokenRepository.save(token);
    }

    @Transactional
    public void resendVerification(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (user.isVerified()) {
            return;
        }
        issueVerificationToken(user);
    }

    private void issueVerificationToken(UserEntity user) {
        String raw = UUID.randomUUID().toString();
        EmailVerificationTokenEntity token = EmailVerificationTokenEntity.builder()
                .user(user)
                .tokenHash(TokenHashUtils.sha256(raw))
                .expiresAt(Instant.now().plus(appProperties.getJwt().getRefreshTtl()))
                .build();
        emailVerificationTokenRepository.save(token);
        emailService.sendVerificationEmail(user.getEmail(), raw);
    }

    private TokensResponse issueTokens(UserEntity user) {
        String access = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refresh = jwtTokenProvider.createRefreshToken(user.getId());
        RefreshTokenEntity refreshEntity = RefreshTokenEntity.builder()
                .user(user)
                .tokenHash(TokenHashUtils.sha256(refresh))
                .expiresAt(Instant.now().plus(appProperties.getJwt().getRefreshTtl()))
                .build();
        refreshTokenRepository.save(refreshEntity);
        return TokensResponse.builder()
                .accessToken(access)
                .refreshToken(refresh)
                .tokenType("Bearer")
                .accessExpiresIn(appProperties.getJwt().getAccessTtl().toString())
                .refreshExpiresIn(appProperties.getJwt().getRefreshTtl().toString())
                .build();
    }

    @Transactional(readOnly = true)
    public Long validateAccessToken(String token) {
        Claims claims = jwtTokenProvider.parseClaims(token);
        if (jwtTokenProvider.isRefreshToken(claims)) {
            throw new UnauthorizedException("Access token expected");
        }
        return jwtTokenProvider.getUserId(claims);
    }
}


