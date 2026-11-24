package ru.itmo.pxdkxvan.lab23.auth.dto

import jakarta.validation.constraints.NotBlank

data class RefreshRequest(
    @field:NotBlank
    val refreshToken: String,
)
