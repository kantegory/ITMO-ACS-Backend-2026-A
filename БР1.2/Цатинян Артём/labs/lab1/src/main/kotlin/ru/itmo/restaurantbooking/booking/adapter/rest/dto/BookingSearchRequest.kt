package ru.itmo.restaurantbooking.booking.adapter.rest.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.AssertTrue
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import ru.itmo.restaurantbooking.booking.domain.BookingStatus
import ru.itmo.restaurantbooking.common.domain.DEFAULT_PAGE_SIZE
import ru.itmo.restaurantbooking.common.domain.MAX_PAGE_NUMBER
import ru.itmo.restaurantbooking.common.domain.MAX_PAGE_SIZE
import ru.itmo.restaurantbooking.common.domain.SortDirection
import java.time.LocalDate

data class BookingSearchRequest(
    @field:Schema(
        description = "Статус бронирования",
        example = "CONFIRMED"
    )
    val status: BookingStatus? = null,
    @field:Min(1)
    @field:Max(MAX_PAGE_NUMBER.toLong())
    @field:Schema(
        description = "Номер страницы, начиная с 1",
        example = "1"
    )
    val page: Int = 1,
    @field:Min(1)
    @field:Max(MAX_PAGE_SIZE.toLong())
    @field:Schema(
        description = "Размер страницы",
        example = "10"
    )
    val size: Int = DEFAULT_PAGE_SIZE,
    @field:Schema(
        description = "ID ресторана из GET /api/v1/restaurants",
        example = "1"
    )
    val restaurantId: Long? = null,
    @field:Schema(
        description = "Дата начала периода",
        example = "2026-04-20"
    )
    val dateFrom: LocalDate? = null,
    @field:Schema(
        description = "Дата конца периода",
        example = "2026-04-30"
    )
    val dateTo: LocalDate? = null,
    @field:Schema(
        description = "Направление сортировки по времени бронирования",
        example = "DESC"
    )
    val sortDir: SortDirection = SortDirection.DESC
) {
    @get:AssertTrue(message = "dateTo must not be earlier than dateFrom")
    @get:JsonIgnore
    val isDateRangeValid: Boolean
        get() = dateFrom == null || dateTo == null || !dateTo.isBefore(dateFrom)
}
