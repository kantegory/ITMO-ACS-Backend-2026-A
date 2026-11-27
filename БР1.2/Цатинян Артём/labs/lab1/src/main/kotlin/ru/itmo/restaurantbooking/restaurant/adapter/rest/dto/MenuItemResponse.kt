package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto


data class MenuItemResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val priceMinor: Int,
    val isAvailable: Boolean
)
