package ru.itmo.pxdkxvan.lab1.auth.dto

import ru.itmo.pxdkxvan.lab1.user.dto.UserResponse

data class LoginResponse(
    val accessToken: String,
    val tokenType: String,
    val user: UserResponse,
)
