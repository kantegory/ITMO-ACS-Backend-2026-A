package ru.itmo.restaurantbooking.booking.service

import ru.itmo.restaurantbooking.booking.domain.BookingStatus
import ru.itmo.restaurantbooking.common.domain.SortDirection
import java.time.LocalDate

data class BookingSearchQuery(
    val status: BookingStatus?,
    val page: Int,
    val size: Int,
    val restaurantId: Long?,
    val dateFrom: LocalDate?,
    val dateTo: LocalDate?,
    val sortDirection: SortDirection
)
