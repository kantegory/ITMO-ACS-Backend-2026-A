package org.renting.rentingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.renting.rentingservice.dto.user.UpdateMeRequest;
import org.renting.rentingservice.dto.user.UserMeResponse;
import org.renting.rentingservice.dto.user.UserProfileResponse;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.AuthService;
import org.renting.rentingservice.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Users", description = "Профиль и настройки текущего пользователя")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping("/users/me")
    @Operation(summary = "Мой профиль", description = "Возвращает данные текущего пользователя")
    public UserMeResponse getMe() {
        return userService.getMe(SecurityUtils.currentUserId());
    }

    @PatchMapping("/users/me")
    @Operation(summary = "Обновить профиль", description = "Обновляет данные текущего пользователя")
    public UserMeResponse updateMe(@Valid @RequestBody UpdateMeRequest request) {
        return userService.updateMe(SecurityUtils.currentUserId(), request);
    }

    @PostMapping("/users/me/email/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Повторная отправка email", description = "Генерирует новый токен подтверждения и отправляет письмо")
    public void resendVerifyEmail() {
        authService.resendVerification(SecurityUtils.currentUserId());
    }

    @GetMapping("/users/me/profile")
    @Operation(summary = "Публичный профиль", description = "Возвращает профиль текущего пользователя с его недвижимостью")
    public UserProfileResponse getProfile() {
        return userService.getProfile(SecurityUtils.currentUserId());
    }
}
