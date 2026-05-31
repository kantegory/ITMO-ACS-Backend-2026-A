package ru.itmo.pxdkxvan.lab1.role.dto

import java.util.UUID

data class RoleResponse(
    val id: UUID,
    val name: String,
    val description: String?,
    val isSystem: Boolean,
)
