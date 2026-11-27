package ru.itmo.restaurantbooking.lab2.review.adapter.rest.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import ru.itmo.restaurantbooking.lab2.review.domain.ReviewRecord
import java.time.LocalDateTime

data class CreateReviewRequest(
    @field:Schema(example = "1001")
    val bookingId: Long,
    @field:Schema(example = "5", minimum = "1", maximum = "5")
    @field:Min(1)
    @field:Max(5)
    val rating: Int,
    @field:Schema(example = "Great dinner, fast service and a very comfortable table.")
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
