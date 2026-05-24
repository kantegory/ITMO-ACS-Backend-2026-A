package ru.itmo.restaurantbooking.lab2.identity.adapter.rest

import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UpdateProfileRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UserProfileResponse
import ru.itmo.restaurantbooking.lab2.identity.service.UserService

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService
) {
    @GetMapping("/me")
    fun me(@RequestHeader("X-User-Id") userId: Long): UserProfileResponse =
        userService.profile(userId)

    @PatchMapping("/me")
    fun updateMe(
        @RequestHeader("X-User-Id") userId: Long,
        @Valid @RequestBody request: UpdateProfileRequest
    ): UserProfileResponse = userService.updateProfile(userId, request)
}
