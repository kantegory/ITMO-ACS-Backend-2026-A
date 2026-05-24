package ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import ru.itmo.restaurantbooking.lab2.identity.domain.UserRecord
import java.time.LocalDateTime

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
        fun from(user: UserRecord, accessToken: String) =
            AuthResponse(
                accessToken = accessToken,
                user = user.toProfile()
            )
    }
}

data class TokenValidationRequest(
    val accessToken: String
)

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

fun UserRecord.toProfile() =
    UserProfileResponse(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        phone = phone,
        role = role,
        createdAt = createdAt
    )

fun UserRecord.toSummary() =
    UserSummaryResponse(
        id = id,
        email = email,
        firstName = firstName,
        lastName = lastName,
        role = role,
        active = active
    )
