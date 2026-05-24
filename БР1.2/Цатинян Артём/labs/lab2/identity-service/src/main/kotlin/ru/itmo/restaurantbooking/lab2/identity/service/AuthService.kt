package ru.itmo.restaurantbooking.lab2.identity.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.lab2.common.exception.ConflictException
import ru.itmo.restaurantbooking.lab2.common.exception.UnauthorizedException
import ru.itmo.restaurantbooking.lab2.identity.adapter.jooq.UserRepository
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.AuthResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.LoginRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.RegisterRequest
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

@Service
class AuthService(
    private val userRepository: UserRepository
) {
    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw ConflictException("Email already exists")
        }

        val user = userRepository.create(request, hashPassword(request.password))
        return AuthResponse.from(user)
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = userRepository.findByEmail(request.email)
            ?: throw UnauthorizedException("Invalid credentials")

        if (user.passwordHash != hashPassword(request.password)) {
            throw UnauthorizedException("Invalid credentials")
        }

        return AuthResponse.from(user)
    }
}

private fun hashPassword(password: String): String =
    MessageDigest.getInstance("SHA-256")
        .digest(password.toByteArray(StandardCharsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
