package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto

import java.time.LocalTime

data class WorkingHoursResponse(
    val dayOfWeek: Int,
    val openTime: LocalTime?,
    val closeTime: LocalTime?,
    val isClosed: Boolean
)
