package ru.itmo.restaurantbooking.lab2.identity.adapter.rest

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.AuthResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.LoginRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.RegisterRequest
import ru.itmo.restaurantbooking.lab2.identity.service.AuthService

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService
) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest): AuthResponse =
        authService.register(request)

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): AuthResponse =
        authService.login(request)
}
