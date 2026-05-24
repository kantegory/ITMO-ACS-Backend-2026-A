package ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import ru.itmo.restaurantbooking.lab2.review.domain.ReviewRecord
import java.time.LocalDateTime

data class CreateReviewRequest(
    val bookingId: Long,
    @field:Min(1)
    @field:Max(5)
    val rating: Int,
    val comment: String?
)

data class ReviewResponse(
    val id: Long,
    val bookingId: Long,
    val rating: Int,
    val comment: String?,
    val authorName: String,
    val createdAt: LocalDateTime
)

fun ReviewRecord.toResponse() =
    ReviewResponse(
        id = id,
        bookingId = bookingId,
        rating = rating,
        comment = comment,
        authorName = authorNameSnapshot,
        createdAt = createdAt
    )
