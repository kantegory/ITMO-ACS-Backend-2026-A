package ru.itmo.pxdkxvan.lab23.auth.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.auth.common.normalizedEmail
import ru.itmo.pxdkxvan.lab23.auth.dto.AuthContextResponse
import ru.itmo.pxdkxvan.lab23.auth.dto.LoginRequest
import ru.itmo.pxdkxvan.lab23.auth.dto.RefreshRequest
import ru.itmo.pxdkxvan.lab23.auth.dto.RegisterRequest
import ru.itmo.pxdkxvan.lab23.auth.dto.TokenResponse
import ru.itmo.pxdkxvan.lab23.auth.dto.UserRegistrationRequest
import ru.itmo.pxdkxvan.lab23.auth.entity.CredentialEntity
import ru.itmo.pxdkxvan.lab23.auth.repository.CredentialRepository
import java.util.UUID

@Service
class AuthService(
    private val credentialRepository: CredentialRepository,
    private val identities: IdentityDirectory,
    private val passwordEncoder: PasswordEncoder,
    private val accessTokenService: AccessTokenService,
) {
    @Transactional
    fun register(request: RegisterRequest): AuthContextResponse {
        val email = request.email.normalizedEmail()
        require(email.isNotBlank() && request.password.isNotBlank()) { "Email and password are required" }
        check(!credentialRepository.existsByEmailIgnoreCase(email)) { "Email is already in use" }
        val identity = identities.create(
            UserRegistrationRequest(
                firstName = request.firstName.trim(),
                lastName = request.lastName.trim(),
                middleName = request.middleName?.trim()?.ifBlank { null },
                email = email,
                phone = request.phone.trim(),
                role = request.role.trim().uppercase(),
            ),
        )
        credentialRepository.save(
            CredentialEntity(
                userId = identity.userId,
                email = email,
                passwordHash = passwordEncoder.encode(request.password),
            ),
        )
        return identity
    }

    @Transactional
    fun login(request: LoginRequest): TokenResponse {
        val credential = credentialRepository.findByEmailIgnoreCase(request.email.normalizedEmail())
            ?: error("Invalid email or password")
        check(passwordEncoder.matches(request.password, credential.passwordHash)) { "Invalid email or password" }

        val user = identities.find(checkNotNull(credential.userId))
        check(user.active) { "User is inactive" }

        val refreshToken = UUID.randomUUID().toString()
        credential.refreshToken = refreshToken
        credentialRepository.save(credential)

        return TokenResponse(
            accessToken = accessTokenService.issue(user),
            refreshToken = refreshToken,
            tokenType = "Bearer",
            user = user,
        )
    }

    @Transactional
    fun refresh(request: RefreshRequest): TokenResponse {
        val credential = credentialRepository.findByRefreshToken(request.refreshToken)
            ?: error("Invalid refresh token")
        val user = identities.find(checkNotNull(credential.userId))
        check(user.active) { "User is inactive" }

        val refreshToken = UUID.randomUUID().toString()
        credential.refreshToken = refreshToken
        credentialRepository.save(credential)

        return TokenResponse(
            accessToken = accessTokenService.issue(user),
            refreshToken = refreshToken,
            tokenType = "Bearer",
            user = user,
        )
    }
}
