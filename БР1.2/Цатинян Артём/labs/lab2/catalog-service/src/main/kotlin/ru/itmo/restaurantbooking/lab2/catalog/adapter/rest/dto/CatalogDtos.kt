package ru.itmo.restaurantbooking.lab2.catalog.adapter.rest.dto

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime

data class RestaurantSearchQuery(
    val search: String?,
    val cuisine: String?,
    val city: String?,
    val priceSegment: String?,
    val page: Int,
    val size: Int
)

data class CuisineResponse(val id: Long, val name: String)

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

data class RestaurantDetailsResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val city: String,
    val street: String,
    val building: String,
    val phone: String,
    val priceSegment: String,
    val cuisines: List<String>,
    val workingHours: List<WorkingHoursResponse>,
    val rating: BigDecimal,
    val reviewCount: Int
)

data class WorkingHoursResponse(
    val weekDay: Int,
    val opensAt: LocalTime?,
    val closesAt: LocalTime?,
    val closed: Boolean
)

data class TableContextResponse(
    val id: Long,
    val restaurantId: Long,
    val tableNumber: String,
    val seatsCount: Int,
    val zoneName: String?,
    val active: Boolean
)

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

data class MenuCategoryResponse(
    val id: Long,
    val name: String,
    val sortOrder: Int,
    val items: List<MenuItemResponse>
)

data class MenuItemResponse(
    val id: Long,
    val menuCategoryId: Long,
    val name: String,
    val description: String?,
    val priceMinor: Int,
    val currencyCode: String,
    val available: Boolean
)

data class MenuCategoryRow(
    val id: Long,
    val name: String,
    val sortOrder: Int
)
