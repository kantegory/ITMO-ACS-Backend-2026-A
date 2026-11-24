package ru.itmo.pxdkxvan.lab1.auth.controller

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.auth.dto.LoginRequest
import ru.itmo.pxdkxvan.lab1.auth.dto.LoginResponse
import ru.itmo.pxdkxvan.lab1.auth.dto.RegisterRequest
import ru.itmo.pxdkxvan.lab1.user.dto.UserResponse
import ru.itmo.pxdkxvan.lab1.auth.service.AuthService

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest): UserResponse = authService.register(request)

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): LoginResponse = authService.login(request)
}
