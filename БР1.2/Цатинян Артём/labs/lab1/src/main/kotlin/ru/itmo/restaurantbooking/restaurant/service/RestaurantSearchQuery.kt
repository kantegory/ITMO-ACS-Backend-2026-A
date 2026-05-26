package ru.itmo.restaurantbooking.restaurant.service

import ru.itmo.restaurantbooking.common.domain.SortDirection
import ru.itmo.restaurantbooking.restaurant.domain.PriceSegment

data class RestaurantSearchQuery(
    val search: String?,
    val cuisine: String?,
    val city: String?,
    val priceSegment: PriceSegment?,
    val guestsCount: Int?,
    val page: Int,
    val size: Int,
    val sortBy: RestaurantSortBy,
    val sortDirection: SortDirection
)
