package io.github.artsobol.fitnessapi.feature.auth.auth.service;

import io.github.artsobol.fitnessapi.exception.security.AuthenticationException;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.LoginRequest;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.SessionMetadata;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.response.AuthResponse;
import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.request.CreateRefreshTokenRequest;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginServiceImpl implements LoginService {

    private final UserService userService;
    private final AuthResponseFactory authResponseFactory;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(LoginRequest request, SessionMetadata meta) {
        log.info("Starting login username={}", request.username());
        User user = userService.findByUsername(request.username());
        ensureCredentialsValid(request.password(), user.getPasswordHash());

        UUID sessionId = UUID.randomUUID();

        CreateRefreshTokenRequest refreshTokenRequest = new CreateRefreshTokenRequest(
            user, sessionId, meta.ipAddress(), meta.userAgent(), meta.deviceName()
        );
        AuthResponse response = authResponseFactory.create(refreshTokenRequest);

        log.info("Login finished userId={} username={}", response.user().userId(), response.user().username());
        return response;
    }

    private void ensureCredentialsValid(String password, String confirmPassword) {
        if (!passwordEncoder.matches(password, confirmPassword)) {
            throw new AuthenticationException("auth.bad-credentials");
        }
    }
}
