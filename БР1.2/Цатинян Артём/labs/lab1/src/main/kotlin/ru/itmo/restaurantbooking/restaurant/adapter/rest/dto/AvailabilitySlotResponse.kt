package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto

import java.time.LocalDateTime

data class AvailabilitySlotResponse(
    val tableId: Long,
    val tableNumber: String,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val seatsCount: Int
)
