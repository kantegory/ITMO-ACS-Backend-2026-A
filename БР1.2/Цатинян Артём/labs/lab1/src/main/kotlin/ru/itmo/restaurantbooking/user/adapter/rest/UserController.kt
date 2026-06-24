package ru.itmo.restaurantbooking.user.adapter.rest

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.auth.domain.AuthenticatedUser
import ru.itmo.restaurantbooking.common.adapter.rest.config.OpenApiConfig
import ru.itmo.restaurantbooking.user.adapter.rest.dto.UpdateProfileRequest
import ru.itmo.restaurantbooking.user.adapter.rest.dto.UserProfileResponse
import ru.itmo.restaurantbooking.user.service.UserService

@RestController
@RequestMapping("/api/v1/users")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
class UserController(
    private val userService: UserService
) {

    @GetMapping("/me")
    fun me(authentication: Authentication): UserProfileResponse = userService.getCurrentUser((authentication.principal as AuthenticatedUser).id)

    @PatchMapping("/me")
    fun updateMe(authentication: Authentication, @RequestBody request: UpdateProfileRequest): UserProfileResponse =
        userService.updateCurrentUser((authentication.principal as AuthenticatedUser).id, request)
}
