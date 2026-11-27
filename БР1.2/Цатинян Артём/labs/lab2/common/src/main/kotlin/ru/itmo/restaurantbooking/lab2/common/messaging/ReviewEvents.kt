package ru.itmo.restaurantbooking.lab2.common.messaging

import java.time.LocalDateTime

object ReviewEvents {
    const val EXCHANGE = "restaurant.review.events"
    const val CREATED_QUEUE = "catalog.review-created"
    const val CREATED_ROUTING_KEY = "review.created"
}

data class ReviewCreatedEvent(
    val eventId: String,
    val reviewId: Long,
    val bookingId: Long,
    val restaurantId: Long,
    val userId: Long,
    val rating: Int,
    val occurredAt: LocalDateTime
)
