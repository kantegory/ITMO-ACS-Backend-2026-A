package ru.itmo.restaurantbooking.booking.adapter.rest.dto

import java.time.LocalDateTime

data class BookingRestaurantResponse(
    val id: Long,
    val name: String,
    val city: String,
    val street: String,
    val building: String
)
