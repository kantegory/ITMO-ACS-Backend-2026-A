package ru.itmo.restaurantbooking.lab2.booking.adapter.client.catalog.dto

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime

data class RestaurantBookingContext(
    val restaurant: RestaurantSummaryResponse,
    val table: TableContextResponse,
    val workingHours: WorkingHoursResponse?,
    val withinWorkingHours: Boolean
)

data class AvailabilityContextResponse(
    val restaurantId: Long,
    val date: LocalDate,
    val open: Boolean,
    val workingHours: WorkingHoursResponse?,
    val tables: List<TableContextResponse>
)

data class RestaurantSummaryResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val city: String,
    val street: String,
    val building: String,
    val phone: String,
    val priceSegment: String,
    val rating: BigDecimal,
    val reviewCount: Int
)

data class TableContextResponse(
    val id: Long,
    val restaurantId: Long,
    val tableNumber: String,
    val seatsCount: Int,
    val zoneName: String?,
    val active: Boolean
)

data class WorkingHoursResponse(
    val weekDay: Int,
    val opensAt: LocalTime?,
    val closesAt: LocalTime?,
    val closed: Boolean
)
