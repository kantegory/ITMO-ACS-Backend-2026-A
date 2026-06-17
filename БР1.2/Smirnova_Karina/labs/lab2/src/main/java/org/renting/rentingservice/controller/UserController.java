package org.renting.rentingservice.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.dto.user.UpdateMeRequest;
import org.renting.rentingservice.dto.user.UserMeResponse;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.AuthService;
import org.renting.rentingservice.service.UserService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Profile("user")
@Tag(name = "Users", description = "Current user profile and settings")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping("/users/me")
    @Operation(summary = "Get my profile")
    public UserMeResponse getMe() {
        return userService.getMe(SecurityUtils.currentUserId());
    }

    @PatchMapping("/users/me")
    @Operation(summary = "Update my profile")
    public UserMeResponse updateMe(@Valid @RequestBody UpdateMeRequest request) {
        return userService.updateMe(SecurityUtils.currentUserId(), request);
    }

    @PostMapping("/users/me/email/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Resend verification email")
    public void resendVerifyEmail() {
        authService.resendVerification(SecurityUtils.currentUserId());
    }

    @GetMapping("/internal/users/{userId}")
    @Operation(summary = "Get public profile for internal services")
    public UserMeResponse getPublicUser(@PathVariable Long userId) {
        return userService.getMe(userId);
    }
}
