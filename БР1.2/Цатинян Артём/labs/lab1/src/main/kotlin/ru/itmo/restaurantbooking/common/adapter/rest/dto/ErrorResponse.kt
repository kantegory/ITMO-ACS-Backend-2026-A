package ru.itmo.restaurantbooking.common.adapter.rest.dto

data class ErrorResponse(
    val timestamp: String,
    val status: Int,
    val error: String,
    val message: String,
    val path: String,
    val details: List<String> = emptyList()
)
