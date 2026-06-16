package ru.itmo.restaurantbooking.booking.adapter.rest.dto

import java.time.LocalDateTime

data class BookingResponse(
    val id: Long,
    val status: String,
    val guestsCount: Int,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val specialRequests: String?,
    val createdAt: LocalDateTime,
    val restaurant: BookingRestaurantResponse,
    val table: BookingTableResponse
)
