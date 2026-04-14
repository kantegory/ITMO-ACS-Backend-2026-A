package ru.itmo.restaurantbooking.booking.adapter.rest.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.AssertTrue
import jakarta.validation.constraints.Future
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Positive
import ru.itmo.restaurantbooking.common.domain.MAX_GUESTS_COUNT
import java.time.LocalDateTime

data class CreateBookingRequest(
    @field:Schema(
        description = "ID ресторана из GET /api/v1/restaurants",
        example = "1"
    )
    val restaurantId: Long,
    @field:Schema(
        description = "ID столика из GET /api/v1/restaurants/{restaurantId}/availability",
        example = "1"
    )
    val tableId: Long,
    @field:Future
    @field:Schema(
        description = "Время начала бронирования. Лучше брать из availability",
        example = "2026-04-20T18:00:00"
    )
    val startsAt: LocalDateTime,
    @field:Future
    @field:Schema(
        description = "Время окончания бронирования. Лучше брать из availability",
        example = "2026-04-20T20:00:00"
    )
    val endsAt: LocalDateTime,
    @field:Positive
    @field:Max(MAX_GUESTS_COUNT.toLong())
    @field:Schema(
        description = "Количество гостей",
        example = "2"
    )
    val guestsCount: Int,
    @field:Schema(
        description = "Пожелания к бронированию",
        example = "Столик у окна"
    )
    val specialRequests: String? = null
) {
    @get:AssertTrue(message = "endsAt must be after startsAt")
    @get:JsonIgnore
    val isTimeRangeValid: Boolean
        get() = endsAt.isAfter(startsAt)
}
