package ru.itmo.restaurantbooking.auth.adapter.rest.dto

data class AuthResponse(
    val accessToken: String,
    val tokenType: String = "Bearer"
)
