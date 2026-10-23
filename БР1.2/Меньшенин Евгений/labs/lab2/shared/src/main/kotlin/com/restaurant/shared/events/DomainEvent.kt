package com.restaurant.shared.events

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

object EventTypes {
    const val BOOKING_CREATED = "booking.created"
    const val BOOKING_CANCELLED = "booking.cancelled"
    const val REVIEW_CREATED = "review.created"
    const val REVIEW_UPDATED = "review.updated"
    const val REVIEW_DELETED = "review.deleted"
    const val RESTAURANT_DELETED = "restaurant.deleted"
}

@Serializable
data class DomainEvent(
    val eventId: String,
    val type: String,
    val occurredAt: String,
    val payload: JsonObject,
)

val eventJson = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
}

fun buildEvent(type: String, eventId: String, occurredAt: String, payload: JsonObject): DomainEvent =
    DomainEvent(eventId = eventId, type = type, occurredAt = occurredAt, payload = payload)

fun bookingPayload(bookingId: Int, tableId: Int, restaurantId: Int, bookingDate: String, startTime: String, endTime: String): JsonObject =
    buildJsonObject {
        put("bookingId", bookingId)
        put("tableId", tableId)
        put("restaurantId", restaurantId)
        put("bookingDate", bookingDate)
        put("startTime", startTime)
        put("endTime", endTime)
    }

fun reviewPayload(reviewId: Int, restaurantId: Int, userId: Int, rating: Int): JsonObject =
    buildJsonObject {
        put("reviewId", reviewId)
        put("restaurantId", restaurantId)
        put("userId", userId)
        put("rating", rating)
    }

fun restaurantDeletedPayload(restaurantId: Int): JsonObject =
    buildJsonObject { put("restaurantId", restaurantId) }
