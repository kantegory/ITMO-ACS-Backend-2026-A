package ru.itmo.pxdkxvan.lab23.auth.dto

data class UserRegistrationRequest(
    val firstName: String,
    val lastName: String,
    val middleName: String?,
    val email: String,
    val phone: String,
    val role: String,
)
