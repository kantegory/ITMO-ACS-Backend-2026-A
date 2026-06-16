package org.renting.rentingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.renting.rentingservice.dto.auth.*;
import org.renting.rentingservice.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Авторизация и верификация пользователя")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Регистрация", description = "Создаёт пользователя и отправляет email для подтверждения")
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Вход", description = "Проверяет логин и пароль и выдаёт access и refresh токены")
    public TokensResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/auth/refresh")
    @Operation(summary = "Обновление токенов", description = "Проверяет refresh token и выдаёт новую пару access и refresh")
    public TokensResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Выход", description = "Отзывает refresh token текущей сессии")
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
    }

    @PostMapping("/users/email/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Подтверждение email", description = "Подтверждает email по токену из письма")
    public void confirmEmail(@Valid @RequestBody EmailConfirmRequest request) {
        authService.confirmEmail(request);
    }
}
