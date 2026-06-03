package com.petproject.itmoacsbackend.auth.service;

import com.petproject.itmoacsbackend.auth.dto.*;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import com.petproject.itmoacsbackend.auth.enums.GlobalRole;
import com.petproject.itmoacsbackend.users.repositories.UserRepository;
import io.jsonwebtoken.security.SecurityException;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public AuthResponse authenticate(@Valid AuthRequest request) {
        log.atInfo().log("authenticate called");
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        UserEntity user = userRepository.findByUsername(request.username()).orElseThrow(
                () -> new IllegalArgumentException("Username: "+ request.username() + " not found")
        );

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenService.createRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();

    }

    public AuthResponse register(@Valid RegisterRequest request) {
        log.atInfo().log("register called");
        UserEntity user = UserEntity.builder()
                .email(request.email())
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .isRenter(true)
                .globalRole(GlobalRole.USER)
                .build();

        UserEntity savedUser = userRepository.save(user);

        String token = jwtService.generateAccessToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        refreshTokenService.createRefreshToken(savedUser, refreshToken);

        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .build();
    }

    public RefreshTokenResponse refresh(@Valid RefreshTokenRequest request) {

        String refreshToken = request.refreshToken();

        if (!refreshTokenService.validateRefreshToken(refreshToken)) {
            throw new SecurityException("Invalid refresh token");
        }

        UserEntity user = refreshTokenService.getUserByRefreshToken(refreshToken);
        if (user == null) {
            throw new SecurityException("Invalid refresh token");
        }

        String newAccessToken = jwtService.generateAccessToken(user);

        String newRefreshToken = jwtService.generateRefreshToken(user);
        refreshTokenService.createRefreshToken(user, newRefreshToken);
        refreshTokenService.revokeRefreshToken(refreshToken);

        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    public void logout(@Valid LogoutRequest request) {
        refreshTokenService.revokeRefreshToken(request.refreshToken());
    }

}
