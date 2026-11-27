package ru.itmo.restaurantbooking.lab2.booking.domain

import java.time.LocalDateTime

data class BookingRecord(
    val id: Long,
    val userId: Long,
    val restaurantId: Long,
    val tableId: Long,
    val status: String,
    val guestsCount: Int,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val specialRequests: String?,
    val restaurantNameSnapshot: String,
    val tableNumberSnapshot: String,
    val tableSeatsSnapshot: Int,
    val createdAt: LocalDateTime
)

data class PageResult<T>(
    val items: List<T>,
    val totalItems: Long
)
