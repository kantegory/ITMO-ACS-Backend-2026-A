package ru.itmo.pxdkxvan.lab23.auth.dto

data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String,
    val user: AuthContextResponse,
)
