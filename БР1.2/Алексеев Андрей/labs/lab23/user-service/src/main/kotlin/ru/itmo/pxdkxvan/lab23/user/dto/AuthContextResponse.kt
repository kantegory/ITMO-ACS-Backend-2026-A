package ru.itmo.pxdkxvan.lab23.user.dto

import java.util.UUID

data class AuthContextResponse(
    val userId: UUID,
    val email: String,
    val roles: List<String>,
    val active: Boolean,
)
