package ru.itmo.pxdkxvan.lab1.auth.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RegisterRequest(
    @field:NotBlank
    val role: String,
    @field:NotBlank
    @field:Size(max = 100)
    val firstName: String,
    @field:NotBlank
    @field:Size(max = 100)
    val lastName: String,
    @field:Size(max = 100)
    val middleName: String? = null,
    @field:Email
    @field:NotBlank
    @field:Size(max = 255)
    val email: String,
    @field:NotBlank
    @field:Size(min = 8, max = 255)
    val password: String,
    @field:NotBlank
    @field:Size(max = 32)
    val phone: String,
)
