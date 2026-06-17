package ru.itmo.restaurantbooking.review.adapter.rest.dto

import java.time.LocalDateTime

data class ReviewResponse(
    val id: Long,
    val bookingId: Long,
    val userId: Long,
    val rating: Int,
    val comment: String?,
    val createdAt: LocalDateTime
)
