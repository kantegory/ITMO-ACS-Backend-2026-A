package ru.itmo.pxdkxvan.lab1.auth.service

import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import ru.itmo.pxdkxvan.lab1.common.parseEnumValue
import ru.itmo.pxdkxvan.lab1.auth.dto.LoginRequest
import ru.itmo.pxdkxvan.lab1.auth.dto.LoginResponse
import ru.itmo.pxdkxvan.lab1.auth.dto.RegisterRequest
import ru.itmo.pxdkxvan.lab1.user.dto.UserResponse
import ru.itmo.pxdkxvan.lab1.user.dto.UserUpdateRequest
import ru.itmo.pxdkxvan.lab1.role.repository.RoleRepository
import ru.itmo.pxdkxvan.lab1.user.mapper.UserMapper
import ru.itmo.pxdkxvan.lab1.user.repository.UserAccountRepository
import ru.itmo.pxdkxvan.lab1.user.service.CurrentUserService
import ru.itmo.pxdkxvan.lab1.security.AccessTokenService

@Service
class AuthService(
    private val userAccountRepository: UserAccountRepository,
    private val roleRepository: RoleRepository,
    private val currentUserService: CurrentUserService,
    private val passwordEncoder: PasswordEncoder,
    private val accessTokenService: AccessTokenService,
    private val userMapper: UserMapper,
) {
    @Transactional
    fun register(request: RegisterRequest): UserResponse {
        val roleName = parseEnumValue<SystemRole>("role", request.role)
        if (roleName != SystemRole.APPLICANT && roleName != SystemRole.EMPLOYER) {
            throw ApiException(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.VALIDATION,
                "Invalid value for role",
            )
        }
        ensureEmailAvailable(request.email)
        ensurePhoneAvailable(request.phone)

        val role = roleRepository.findByName(roleName.name)
            ?: throw ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Role ${roleName.name} is not configured")

        val user = userMapper.fromRawData(
            firstName = request.firstName.trim(),
            lastName = request.lastName.trim(),
            middleName = request.middleName?.trim()?.ifBlank { null },
            email = request.email.trim().lowercase(),
            phone = request.phone.trim(),
            passwordHash = passwordEncoder.encode(request.password),
            roles = setOf(role),
        )

        val saved = userAccountRepository.saveAndFlush(user)
        return userMapper.toUserResponse(
            userAccountRepository.findById(saved.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "User was not found after registration")
            },
        )
    }

    @Transactional(readOnly = true)
    fun login(request: LoginRequest): LoginResponse {
        val user = userAccountRepository.findByEmailIgnoreCase(request.email.trim().lowercase())
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, "Invalid email or password")

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, "Invalid email or password")
        }

        val token = accessTokenService.generateToken(
            userId = user.id!!,
            email = user.email,
            roles = user.roles.map { parseEnumValue<SystemRole>("role", it.name) }.toSet(),
        )

        return LoginResponse(
            accessToken = token,
            tokenType = "Bearer",
            user = userMapper.toUserResponse(user),
        )
    }

    @Transactional(readOnly = true)
    fun currentUser(jwt: Jwt): UserResponse = userMapper.toUserResponse(currentUserService.currentUser(jwt))

    @Transactional
    fun updateCurrentUser(jwt: Jwt, request: UserUpdateRequest): UserResponse {
        val user = currentUserService.currentUser(jwt)

        request.firstName?.let {
            ru.itmo.pxdkxvan.lab1.common.requireCondition(it.isNotBlank(), "first_name must not be blank", "first_name")
            user.firstName = it.trim()
        }
        request.lastName?.let {
            ru.itmo.pxdkxvan.lab1.common.requireCondition(it.isNotBlank(), "last_name must not be blank", "last_name")
            user.lastName = it.trim()
        }
        if (request.middleName != null) {
            user.middleName = request.middleName.trim().ifBlank { null }
        }
        request.email?.trim()?.lowercase()?.let {
            if (it != user.email) {
                ensureEmailAvailable(it)
                user.email = it
            }
        }
        request.phone?.trim()?.let {
            if (it != user.phone) {
                ensurePhoneAvailable(it)
                user.phone = it
            }
        }

        return userMapper.toUserResponse(userAccountRepository.saveAndFlush(user))
    }

    private fun ensureEmailAvailable(email: String) {
        if (userAccountRepository.existsByEmailIgnoreCase(email.trim().lowercase())) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Email is already in use")
        }
    }

    private fun ensurePhoneAvailable(phone: String) {
        if (userAccountRepository.existsByPhone(phone.trim())) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Phone is already in use")
        }
    }
}
