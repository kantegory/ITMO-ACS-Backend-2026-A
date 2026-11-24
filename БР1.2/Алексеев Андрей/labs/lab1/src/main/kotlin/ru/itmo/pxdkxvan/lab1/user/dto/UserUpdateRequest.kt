package ru.itmo.pxdkxvan.lab1.user.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Size

data class UserUpdateRequest(
    @field:Size(max = 100)
    val firstName: String? = null,
    @field:Size(max = 100)
    val lastName: String? = null,
    @field:Size(max = 100)
    val middleName: String? = null,
    @field:Email
    @field:Size(max = 255)
    val email: String? = null,
    @field:Size(max = 32)
    val phone: String? = null,
)
