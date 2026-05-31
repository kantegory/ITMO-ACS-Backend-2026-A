package ru.itmo.pxdkxvan.lab23.user.dto

import java.util.UUID

data class UserResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val middleName: String?,
    val email: String,
    val phone: String,
    val active: Boolean,
    val roles: List<String>,
)
