package ru.itmo.pxdkxvan.lab1.role.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RoleCreateRequest(
    @field:NotBlank
    @field:Size(max = 50)
    val name: String,
    @field:Size(max = 500)
    val description: String? = null,
    val isSystem: Boolean = false,
)
