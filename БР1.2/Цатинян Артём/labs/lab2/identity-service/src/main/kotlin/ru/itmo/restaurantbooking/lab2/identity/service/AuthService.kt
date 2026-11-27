package ru.itmo.restaurantbooking.lab2.identity.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.lab2.common.auth.AuthenticatedUser
import ru.itmo.restaurantbooking.lab2.common.exception.ConflictException
import ru.itmo.restaurantbooking.lab2.common.exception.UnauthorizedException
import ru.itmo.restaurantbooking.lab2.identity.adapter.jooq.UserRepository
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.AuthResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.LoginRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.OAuthTokenResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.RegisterRequest
import ru.itmo.restaurantbooking.lab2.identity.config.JwtProperties
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val jwtTokenService: JwtTokenService,
    private val jwtProperties: JwtProperties
) {
    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw ConflictException("Email already exists")
        }

        val user = userRepository.create(request, hashPassword(request.password))
        return AuthResponse.from(user, jwtTokenService.issue(user))
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = authenticateCredentials(request.email, request.password)
        return AuthResponse.from(user, jwtTokenService.issue(user))
    }

    fun token(username: String, password: String): OAuthTokenResponse {
        val user = authenticateCredentials(username, password)
        return OAuthTokenResponse(
            accessToken = jwtTokenService.issue(user),
            expiresIn = jwtProperties.ttlSeconds
        )
    }

    private fun authenticateCredentials(email: String, password: String): ru.itmo.restaurantbooking.lab2.identity.domain.UserRecord {
        val user = userRepository.findByEmail(email)
            ?: throw UnauthorizedException("Invalid credentials")

        if (user.passwordHash != hashPassword(password)) {
            throw UnauthorizedException("Invalid credentials")
        }

        return user
    }

    fun authenticate(authorizationHeader: String?): AuthenticatedUser {
        val token = authorizationHeader
            ?.removePrefix("Bearer ")
            ?.takeIf { it.isNotBlank() }
            ?: throw UnauthorizedException("Bearer token is required")

        return validateToken(token)
    }

    fun validateToken(accessToken: String): AuthenticatedUser {
        val claims = jwtTokenService.validate(accessToken)
        val user = userRepository.findById(claims.userId)
            ?: throw UnauthorizedException("Invalid access token")

        if (!user.active) {
            throw UnauthorizedException("User is inactive")
        }

        return AuthenticatedUser(
            id = user.id,
            email = user.email,
            firstName = user.firstName,
            lastName = user.lastName,
            role = user.role,
            active = user.active
        )
    }
}

private fun hashPassword(password: String): String =
    MessageDigest.getInstance("SHA-256")
        .digest(password.toByteArray(StandardCharsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
