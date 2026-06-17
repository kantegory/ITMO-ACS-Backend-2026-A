package ru.itmo.restaurantbooking.user.adapter.rest.dto

data class UpdateProfileRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null
)
