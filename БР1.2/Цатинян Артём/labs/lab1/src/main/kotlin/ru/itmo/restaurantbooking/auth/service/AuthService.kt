package ru.itmo.restaurantbooking.auth.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.auth.adapter.rest.dto.AuthResponse
import ru.itmo.restaurantbooking.auth.adapter.rest.dto.LoginRequest
import ru.itmo.restaurantbooking.auth.adapter.rest.dto.RegisterRequest
import ru.itmo.restaurantbooking.auth.domain.AuthenticatedUser
import ru.itmo.restaurantbooking.common.exception.ConflictException
import ru.itmo.restaurantbooking.common.exception.UnauthorizedException
import ru.itmo.restaurantbooking.jooq.tables.pojos.Users
import ru.itmo.restaurantbooking.user.adapter.jdbc.UserDao
import ru.itmo.restaurantbooking.user.domain.UserRole
import java.time.LocalDateTime

@Service
class AuthService(
    private val userDao: UserDao,
    private val passwordEncoder: PasswordEncoder,
    private val jwtService: JwtService
) {

    fun register(request: RegisterRequest): AuthResponse {
        if (userDao.findByEmail(request.email) != null) {
            throw ConflictException("User with this email already exists")
        }

        val user = Users()
            .setEmail(request.email.trim().lowercase())
            .setPasswordHash(passwordEncoder.encode(request.password))
            .setFirstName(request.firstName.trim())
            .setLastName(request.lastName.trim())
            .setPhone(request.phone.trim())
            .setRole(UserRole.CUSTOMER)
            .setIsActive(true)
            .setCreatedAt(LocalDateTime.now())

        val createdUser = userDao.insertReturning(user)
        val token = jwtService.generateToken(
            AuthenticatedUser(
                createdUser.id,
                createdUser.email,
                createdUser.role
            )
        )
        return AuthResponse(token)
    }

    fun login(request: LoginRequest): AuthResponse {
        val user = userDao.findByEmail(request.email.trim().lowercase())
            ?: throw UnauthorizedException("Invalid email or password")

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw UnauthorizedException("Invalid email or password")
        }

        val token = jwtService.generateToken(AuthenticatedUser(user.id, user.email, user.role))
        return AuthResponse(token)
    }
}
