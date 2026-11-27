package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto


data class RestaurantPhotoResponse(
    val id: Long,
    val photoUrl: String,
    val sortOrder: Int
)
