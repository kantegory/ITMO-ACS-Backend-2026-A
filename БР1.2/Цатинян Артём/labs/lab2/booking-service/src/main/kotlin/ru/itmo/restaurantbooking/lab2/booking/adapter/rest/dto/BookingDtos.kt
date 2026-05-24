package ru.itmo.restaurantbooking.lab2.booking.adapter.rest.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import ru.itmo.restaurantbooking.lab2.booking.domain.BookingRecord
import java.time.LocalDateTime

data class CreateBookingRequest(
    val restaurantId: Long,
    val tableId: Long,
    val startsAt: LocalDateTime,
    val endsAt: LocalDateTime,
    @field:Min(1)
    @field:Max(20)
    val guestsCount: Int,
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
