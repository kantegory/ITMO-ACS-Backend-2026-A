package ru.itmo.rentease.identity;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.ApiDtos;
import ru.itmo.rentease.common.AppException;
import ru.itmo.rentease.common.JwtService;
import ru.itmo.rentease.common.Role;
import ru.itmo.rentease.common.SecurityConfig;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository users, RefreshTokenRepository refreshTokens,
                          PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @GetMapping("/health")
    ApiDtos.HealthResponse health() { return new ApiDtos.HealthResponse("healthy", "identity-service"); }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    ApiDtos.UserResponse register(@Valid @RequestBody ApiDtos.RegisterRequest request) {
        if (users.existsByEmail(request.email())) throw AppException.conflict("Email is already registered");
        Role role = request.role() == null ? Role.tenant : request.role();
        if (role == Role.admin) throw AppException.forbidden("Admin self-registration is disabled");
        UserEntity user = new UserEntity();
        user.email = request.email();
        user.passwordHash = passwordEncoder.encode(request.password());
        user.fullName = request.fullName();
        user.phone = request.phone();
        user.role = role;
        return response(users.save(user));
    }

    @PostMapping("/auth/login")
    ApiDtos.TokenResponse login(@Valid @RequestBody ApiDtos.LoginRequest request) {
        UserEntity user = users.findByEmail(request.email())
                .filter(value -> value.active && passwordEncoder.matches(request.password(), value.passwordHash))
                .orElseThrow(() -> AppException.unauthorized("Invalid email or password"));
        String refresh = jwtService.refreshToken(user.id, user.role);
        RefreshTokenEntity token = new RefreshTokenEntity();
        token.userId = user.id;
        token.tokenHash = hash(refresh);
        token.expiresAt = Instant.now().plusSeconds(604800);
        refreshTokens.save(token);
        return new ApiDtos.TokenResponse(jwtService.userToken(user.id, user.role), refresh, "bearer");
    }

    @PostMapping("/auth/refresh")
    ApiDtos.TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        RefreshTokenEntity stored = refreshTokens.findByTokenHashAndRevokedFalse(hash(request.refreshToken()))
                .filter(token -> token.expiresAt.isAfter(Instant.now()))
                .orElseThrow(() -> AppException.unauthorized("Invalid refresh token"));
        UserEntity user = users.findById(stored.userId).filter(value -> value.active)
                .orElseThrow(() -> AppException.unauthorized("User is inactive"));
        stored.revoked = true;
        refreshTokens.save(stored);
        String nextRefresh = jwtService.refreshToken(user.id, user.role);
        RefreshTokenEntity next = new RefreshTokenEntity();
        next.userId = user.id;
        next.tokenHash = hash(nextRefresh);
        next.expiresAt = Instant.now().plusSeconds(604800);
        refreshTokens.save(next);
        return new ApiDtos.TokenResponse(jwtService.userToken(user.id, user.role), nextRefresh, "bearer");
    }

    @GetMapping("/users/me")
    ApiDtos.UserResponse me() {
        return response(users.findById(SecurityConfig.currentUserId())
                .orElseThrow(() -> AppException.notFound("User not found")));
    }

    private ApiDtos.UserResponse response(UserEntity user) {
        return new ApiDtos.UserResponse(user.id, user.email, user.fullName, user.phone, user.role);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte item : digest) result.append(String.format("%02x", item));
            return result.toString();
        } catch (Exception ex) { throw new IllegalStateException(ex); }
    }

    public record RefreshRequest(@com.fasterxml.jackson.annotation.JsonProperty("refresh_token")
                                  @jakarta.validation.constraints.NotBlank String refreshToken) {}
}
