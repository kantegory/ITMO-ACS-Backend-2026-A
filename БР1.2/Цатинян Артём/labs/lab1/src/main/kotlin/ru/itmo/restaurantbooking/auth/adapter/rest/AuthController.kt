package ru.itmo.restaurantbooking.auth.adapter.rest

import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.auth.adapter.rest.dto.AuthResponse
import ru.itmo.restaurantbooking.auth.adapter.rest.dto.LoginRequest
import ru.itmo.restaurantbooking.auth.adapter.rest.dto.RegisterRequest
import ru.itmo.restaurantbooking.auth.service.AuthService

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService
) {
    @PostMapping("/register")
    fun register(
        @Valid @RequestBody request: RegisterRequest
    ) = authService.register(request)

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest
    ) = authService.login(request)
}
