package ru.itmo.restaurantbooking.lab2.identity

import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.common.exception.ConflictException
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import ru.itmo.restaurantbooking.lab2.common.exception.UnauthorizedException
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.LocalDateTime
import java.util.Base64

@SpringBootApplication(scanBasePackages = ["ru.itmo.restaurantbooking.lab2"])
class IdentityServiceApplication

fun main(args: Array<String>) {
    runApplication<IdentityServiceApplication>(*args)
}

@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val userRepository: UserRepository
) {
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(
        @Valid @RequestBody request: RegisterRequest
    ): AuthResponse {
        if (userRepository.existsByEmail(request.email)) {
            throw ConflictException("Email already exists")
        }

        val user = userRepository.create(request)
        return AuthResponse.from(user)
    }

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest
    ): AuthResponse {
        val user = userRepository.findByEmail(request.email)
            ?: throw UnauthorizedException("Invalid credentials")

        if (user.passwordHash != hashPassword(request.password)) {
            throw UnauthorizedException("Invalid credentials")
        }

        return AuthResponse.from(user)
    }
}

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userRepository: UserRepository
) {
    @GetMapping("/me")
    fun me(
        @RequestHeader("X-User-Id") userId: Long
    ) = userRepository.findById(userId)?.toProfile()
        ?: throw NotFoundException("User not found")

    @PatchMapping("/me")
    fun updateMe(
        @RequestHeader("X-User-Id") userId: Long,
        @Valid @RequestBody request: UpdateProfileRequest
    ) = userRepository.update(userId, request).toProfile()
}

@RestController
@RequestMapping("/internal/v1/users")
class InternalUserController(
    private val userRepository: UserRepository
) {
    @GetMapping("/{userId}/summary")
    fun summary(
        @PathVariable userId: Long
    ) = userRepository.findById(userId)?.toSummary()
        ?: throw NotFoundException("User not found")
}

@Component
class UserRepository(
    private val jdbc: NamedParameterJdbcTemplate
) {
    fun existsByEmail(email: String): Boolean =
        jdbc.queryForObject(
            "select exists(select 1 from users where email = :email)",
            mapOf("email" to email.lowercase()),
            Boolean::class.java
        ) ?: false

    fun findByEmail(email: String): UserRecord? =
        jdbc.query(
            "select * from users where email = :email and is_active = true",
            mapOf("email" to email.lowercase())
        ) { rs, _ -> rs.toUserRecord() }.firstOrNull()

    fun findById(id: Long): UserRecord? =
        jdbc.query(
            "select * from users where id = :id and is_active = true",
            mapOf("id" to id)
        ) { rs, _ -> rs.toUserRecord() }.firstOrNull()

    fun create(request: RegisterRequest): UserRecord {
        val id = jdbc.queryForObject(
            """
            insert into users(email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at)
            values (:email, :passwordHash, :firstName, :lastName, :phone, 'CUSTOMER', true, now(), now())
            returning id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("email", request.email.lowercase())
                .addValue("passwordHash", hashPassword(request.password))
                .addValue("firstName", request.firstName)
                .addValue("lastName", request.lastName)
                .addValue("phone", request.phone),
            Long::class.java
        ) ?: error("Failed to create user")

        return findById(id) ?: error("Created user not found")
    }

    fun update(
        id: Long,
        request: UpdateProfileRequest
    ): UserRecord {
        val current = findById(id) ?: throw NotFoundException("User not found")

        jdbc.update(
            """
            update users
            set first_name = :firstName,
                last_name = :lastName,
                phone = :phone,
                updated_at = now()
            where id = :id
            """.trimIndent(),
            MapSqlParameterSource()
                .addValue("id", id)
                .addValue("firstName", request.firstName ?: current.firstName)
                .addValue("lastName", request.lastName ?: current.lastName)
                .addValue("phone", request.phone ?: current.phone)
        )

        return findById(id) ?: throw NotFoundException("User not found")
    }
}

data class RegisterRequest(
    @field:Email
    val email: String,
    @field:Size(min = 8, max = 64)
    val password: String,
    @field:NotBlank
    val firstName: String,
    @field:NotBlank
    val lastName: String,
    @field:NotBlank
    val phone: String
)

data class LoginRequest(
    @field:Email
    val email: String,
    @field:Size(min = 8, max = 64)
    val password: String
)

data class UpdateProfileRequest(
    val firstName: String?,
    val lastName: String?,
    val phone: String?
)

data class AuthResponse(
    val accessToken: String,
    val tokenType: String = "Bearer",
    val user: UserProfileResponse
) {
    companion object {
        fun from(user: UserRecord) =
            AuthResponse(
                accessToken = Base64.getEncoder()
                    .encodeToString("${user.id}:${user.email}".toByteArray(StandardCharsets.UTF_8)),
                user = user.toProfile()
            )
    }
}

data class UserProfileResponse(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String,
    val role: String,
    val createdAt: LocalDateTime
)

data class UserSummaryResponse(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val active: Boolean
)

data class UserRecord(
    val id: Long,
    val email: String,
    val passwordHash: String,
    val firstName: String,
    val lastName: String,
    val phone: String,
    val role: String,
    val active: Boolean,
    val createdAt: LocalDateTime
)

private fun java.sql.ResultSet.toUserRecord() =
    UserRecord(
        id = getLong("id"),
        email = getString("email"),
        passwordHash = getString("password_hash"),
        firstName = getString("first_name"),
        lastName = getString("last_name"),
        phone = getString("phone"),
        role = getString("role"),
        active = getBoolean("is_active"),
        createdAt = getTimestamp("created_at").toLocalDateTime()
    )

private fun UserRecord.toProfile() =
    UserProfileResponse(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        phone = phone,
        role = role,
        createdAt = createdAt
    )

private fun UserRecord.toSummary() =
    UserSummaryResponse(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role,
        active = active
    )

private fun hashPassword(password: String): String =
    MessageDigest.getInstance("SHA-256")
        .digest(password.toByteArray(StandardCharsets.UTF_8))
        .joinToString("") { "%02x".format(it) }
