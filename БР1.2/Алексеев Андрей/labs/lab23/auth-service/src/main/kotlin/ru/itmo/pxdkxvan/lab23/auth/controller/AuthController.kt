package ru.itmo.pxdkxvan.lab23.auth.controller

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.auth.dto.LoginRequest
import ru.itmo.pxdkxvan.lab23.auth.dto.RefreshRequest
import ru.itmo.pxdkxvan.lab23.auth.dto.RegisterRequest
import ru.itmo.pxdkxvan.lab23.auth.service.AuthService

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/register")
    fun register(@RequestBody request: RegisterRequest) = authService.register(request)

    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest) = authService.login(request)

    @PostMapping("/refresh")
    fun refresh(@RequestBody request: RefreshRequest) = authService.refresh(request)
}
