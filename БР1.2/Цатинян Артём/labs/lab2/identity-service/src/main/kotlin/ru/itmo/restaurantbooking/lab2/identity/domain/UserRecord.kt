package ru.itmo.restaurantbooking.lab2.identity.domain

import java.time.LocalDateTime

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
