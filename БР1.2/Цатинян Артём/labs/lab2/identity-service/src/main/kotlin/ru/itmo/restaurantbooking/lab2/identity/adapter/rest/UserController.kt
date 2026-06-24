package ru.itmo.restaurantbooking.lab2.identity.adapter.rest

import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UpdateProfileRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UserProfileResponse
import ru.itmo.restaurantbooking.lab2.identity.service.AuthService
import ru.itmo.restaurantbooking.lab2.identity.service.UserService

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService,
    private val authService: AuthService
) {
    @GetMapping("/me")
    fun me(
        @Parameter(hidden = true)
        @RequestHeader("Authorization", required = false) authorization: String?
    ): UserProfileResponse =
        userService.profile(authService.authenticate(authorization).id)

    @PatchMapping("/me")
    fun updateMe(
        @Parameter(hidden = true)
        @RequestHeader("Authorization", required = false) authorization: String?,
        @Valid @RequestBody request: UpdateProfileRequest
    ): UserProfileResponse = userService.updateProfile(authService.authenticate(authorization).id, request)
}
