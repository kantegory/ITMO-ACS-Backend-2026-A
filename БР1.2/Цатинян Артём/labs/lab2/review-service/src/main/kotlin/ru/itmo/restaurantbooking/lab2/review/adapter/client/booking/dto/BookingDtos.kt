package ru.itmo.restaurantbooking.lab2.review.adapter.client.booking.dto

import java.time.LocalDateTime

data class BookingReviewContext(
    val bookingId: Long,
    val userId: Long,
    val restaurantId: Long,
    val status: String,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val canReview: Boolean,
    val denialReason: String?
)
