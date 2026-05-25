package ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import ru.itmo.restaurantbooking.lab2.identity.domain.UserRecord
import java.time.LocalDateTime

data class RegisterRequest(
    @field:Schema(example = "emily.carter.lab2@example.com")
    @field:Email
    val email: String,
    @field:Schema(example = "storageAdmin123", minLength = 8, maxLength = 64)
    @field:Size(min = 8, max = 64)
    val password: String,
    @field:Schema(example = "Emily")
    @field:NotBlank
    val firstName: String,
    @field:Schema(example = "Carter")
    @field:NotBlank
    val lastName: String,
    @field:Schema(example = "+79990000001")
    @field:NotBlank
    val phone: String
)

data class LoginRequest(
    @field:Schema(example = "emily.carter.lab2@example.com")
    @field:Email
    val email: String,
    @field:Schema(example = "storageAdmin123", minLength = 8, maxLength = 64)
    @field:Size(min = 8, max = 64)
    val password: String
)

data class OAuthTokenResponse(
    @JsonProperty("access_token")
    val accessToken: String,
    @JsonProperty("token_type")
    val tokenType: String = "Bearer",
    @JsonProperty("expires_in")
    val expiresIn: Long
)

data class UpdateProfileRequest(
    @field:Schema(example = "Emily")
    val firstName: String?,
    @field:Schema(example = "Carter")
    val lastName: String?,
    @field:Schema(example = "+79990000009")
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
