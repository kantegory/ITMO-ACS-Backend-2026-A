package com.petproject.itmoacsbackend.auth.service;

import com.petproject.itmoacsbackend.auth.entities.RefreshTokenEntity;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import com.petproject.itmoacsbackend.auth.repositories.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${jwt.refresh.expiration}")
    private Long refreshExpirationTimeInMillis;

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshTokenEntity createRefreshToken(UserEntity userEntity, String token) {

        // удаляем старве токены пользователя
        refreshTokenRepository.deleteByUser(userEntity);

        RefreshTokenEntity refreshToken = RefreshTokenEntity.builder()
                .token(token)
                .user(userEntity)
                .expiresAt(LocalDateTime.now().plusDays(fromMillisToDays(refreshExpirationTimeInMillis)))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public boolean validateRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .map(refreshToken -> !refreshToken.isExpired() && !refreshToken.getRevoked())
                .orElse(false);
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
        });
    }

    @Transactional
    public UserEntity getUserByRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
                                     .map(RefreshTokenEntity::getUser)
                                     .orElse(null);
    }

    private static Long fromMillisToDays(Long millis) {
        return millis / 86400000L;
    }
}
