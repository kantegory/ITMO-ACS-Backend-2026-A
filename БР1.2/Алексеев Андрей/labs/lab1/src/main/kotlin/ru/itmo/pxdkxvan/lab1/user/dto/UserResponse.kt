package ru.itmo.pxdkxvan.lab1.user.dto

import java.time.OffsetDateTime
import java.util.UUID
import ru.itmo.pxdkxvan.lab1.role.dto.RoleResponse

data class UserResponse(
    val id: UUID,
    val roles: List<RoleResponse>,
    val firstName: String,
    val lastName: String,
    val middleName: String?,
    val email: String,
    val phone: String,
    val isVerified: Boolean,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)
