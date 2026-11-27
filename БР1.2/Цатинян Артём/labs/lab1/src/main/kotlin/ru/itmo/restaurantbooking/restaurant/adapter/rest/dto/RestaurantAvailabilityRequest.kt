package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.FutureOrPresent
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import ru.itmo.restaurantbooking.common.domain.MAX_GUESTS_COUNT
import java.time.LocalDate

data class RestaurantAvailabilityRequest(
    @field:NotNull
    @field:FutureOrPresent
    @field:Schema(
        description = "Дата бронирования",
        example = "2026-04-20"
    )
    val date: LocalDate? = null,
    @field:Min(1)
    @field:Max(MAX_GUESTS_COUNT.toLong())
    @field:Schema(
        description = "Количество гостей",
        example = "2"
    )
    val guestsCount: Int = 1
)
