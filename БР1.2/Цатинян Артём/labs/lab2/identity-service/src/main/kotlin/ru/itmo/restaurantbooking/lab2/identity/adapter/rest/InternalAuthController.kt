package ru.itmo.restaurantbooking.lab2.identity.adapter.rest

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.common.auth.AuthenticatedUser
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.TokenValidationRequest
import ru.itmo.restaurantbooking.lab2.identity.service.AuthService

@RestController
@RequestMapping("/internal/v1/auth")
class InternalAuthController(
    private val authService: AuthService
) {
    @PostMapping("/validate")
    fun validateToken(@RequestBody request: TokenValidationRequest): AuthenticatedUser =
        authService.validateToken(request.accessToken)
}
