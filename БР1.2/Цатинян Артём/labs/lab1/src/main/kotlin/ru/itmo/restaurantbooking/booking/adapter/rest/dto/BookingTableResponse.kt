package ru.itmo.restaurantbooking.booking.adapter.rest.dto


data class BookingTableResponse(
    val id: Long,
    val tableNumber: String,
    val seatsCount: Int,
    val zoneName: String?
)
