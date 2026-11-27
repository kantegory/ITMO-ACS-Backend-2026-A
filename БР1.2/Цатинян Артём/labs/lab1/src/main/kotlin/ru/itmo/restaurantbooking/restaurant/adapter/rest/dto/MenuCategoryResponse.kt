package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto


data class MenuCategoryResponse(
    val id: Long,
    val name: String,
    val sortOrder: Int,
    val items: List<MenuItemResponse>
)
