package ru.itmo.restaurantbooking.lab2.review.domain

import java.time.LocalDateTime

data class ReviewRecord(
    val id: Long,
    val bookingId: Long,
    val restaurantId: Long,
    val userId: Long,
    val rating: Int,
    val comment: String?,
    val authorNameSnapshot: String,
    val createdAt: LocalDateTime
)

data class PageResult<T>(
    val items: List<T>,
    val totalItems: Long
)
