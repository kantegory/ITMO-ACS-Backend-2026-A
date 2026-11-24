package ru.itmo.pxdkxvan.lab23.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class RegisterRequest(
    @field:NotBlank
    val firstName: String,
    @field:NotBlank
    val lastName: String,
    val middleName: String?,
    @field:Email
    val email: String,
    @field:NotBlank
    val phone: String,
    @field:NotBlank
    val password: String,
    @field:NotBlank
    val role: String,
)
