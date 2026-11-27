package ru.itmo.restaurantbooking.review.adapter.rest.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min

data class CreateReviewRequest(
    @field:Min(1) @field:Max(5) val rating: Int,
    val comment: String? = null
)
