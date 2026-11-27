package ru.itmo.restaurantbooking.user.adapter.rest.dto

import java.time.LocalDateTime
import ru.itmo.restaurantbooking.user.domain.UserRole

data class UserProfileResponse(
    val id: Long,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String,
    val role: UserRole,
    val createdAt: LocalDateTime
)
