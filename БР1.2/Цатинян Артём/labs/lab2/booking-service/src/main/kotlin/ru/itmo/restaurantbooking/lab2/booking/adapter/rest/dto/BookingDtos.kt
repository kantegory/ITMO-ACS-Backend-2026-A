package ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import ru.itmo.restaurantbooking.lab2.booking.domain.BookingRecord
import java.time.LocalDateTime

data class CreateBookingRequest(
    @field:Schema(example = "1")
    val restaurantId: Long,
    @field:Schema(example = "2")
    val tableId: Long,
    @field:Schema(example = "2026-06-12T19:00:00")
    val startsAt: LocalDateTime,
    @field:Schema(example = "2026-06-12T21:00:00")
    val endsAt: LocalDateTime,
    @field:Schema(example = "4", minimum = "1", maximum = "20")
    @field:Min(1)
    @field:Max(20)
    val guestsCount: Int,
    @field:Schema(example = "Window table if available")
    val specialRequests: String?
)

data class BookingResponse(
    val id: Long,
    val status: String,
    val guestsCount: Int,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val specialRequests: String?,
    val restaurant: BookingRestaurantResponse,
    val table: BookingTableResponse,
    val createdAt: LocalDateTime
)

data class BookingRestaurantResponse(val id: Long, val name: String)

data class BookingTableResponse(val id: Long, val tableNumber: String, val seatsCount: Int)

data class AvailabilitySlotResponse(
    val tableId: Long,
    val tableNumber: String,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    val seatsCount: Int
)

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

fun BookingRecord.toResponse() =
    BookingResponse(
        id = id,
        status = status,
        guestsCount = guestsCount,
        startsAt = startsAt,
        endsAt = endsAt,
        specialRequests = specialRequests,
        restaurant = BookingRestaurantResponse(restaurantId, restaurantNameSnapshot),
        table = BookingTableResponse(tableId, tableNumberSnapshot, tableSeatsSnapshot),
        createdAt = createdAt
    )
