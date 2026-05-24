package org.renting.rentingservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.dto.auth.EmailConfirmRequest;
import org.renting.rentingservice.dto.auth.LoginRequest;
import org.renting.rentingservice.dto.auth.LogoutRequest;
import org.renting.rentingservice.dto.auth.RefreshRequest;
import org.renting.rentingservice.dto.auth.RegisterRequest;
import org.renting.rentingservice.dto.auth.RegisterResponse;
import org.renting.rentingservice.dto.auth.TokensResponse;
import org.renting.rentingservice.service.AuthService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Profile("user")
@Tag(name = "Auth", description = "Authorization and user verification")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register user")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Login user")
    public TokensResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/auth/refresh")
    @Operation(summary = "Refresh tokens")
    public TokensResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Logout user")
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
    }

    @PostMapping("/users/email/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Confirm email")
    public void confirmEmail(@Valid @RequestBody EmailConfirmRequest request) {
        authService.confirmEmail(request);
    }

    @PostMapping("/auth/validate")
    @Operation(summary = "Validate access token")
    public Map<String, Long> validateToken(@RequestBody Map<String, String> body) {
        return Map.of("userId", authService.validateAccessToken(body.get("token")));
    }
}
