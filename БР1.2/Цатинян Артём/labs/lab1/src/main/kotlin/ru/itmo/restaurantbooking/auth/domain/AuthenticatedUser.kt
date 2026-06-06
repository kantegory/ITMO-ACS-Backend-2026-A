package ru.itmo.restaurantbooking.auth.domain

import ru.itmo.restaurantbooking.user.domain.UserRole

data class AuthenticatedUser(
    val id: Long,
    val email: String,
    val role: UserRole
)
