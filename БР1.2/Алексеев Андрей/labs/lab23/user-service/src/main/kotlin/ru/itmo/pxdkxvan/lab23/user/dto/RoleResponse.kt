package ru.itmo.pxdkxvan.lab23.user.dto

import java.util.UUID

data class RoleResponse(
    val id: UUID,
    val name: String,
    val description: String?,
)
