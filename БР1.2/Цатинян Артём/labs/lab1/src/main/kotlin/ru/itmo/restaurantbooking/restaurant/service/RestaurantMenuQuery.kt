package ru.itmo.restaurantbooking.restaurant.service


data class RestaurantMenuQuery(
    val category: String?,
    val search: String?,
    val isAvailable: Boolean?,
    val minPrice: Int?,
    val maxPrice: Int?
)
