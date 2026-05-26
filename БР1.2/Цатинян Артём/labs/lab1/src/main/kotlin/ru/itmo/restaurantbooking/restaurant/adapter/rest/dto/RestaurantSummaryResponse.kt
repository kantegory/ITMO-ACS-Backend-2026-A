package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto

import java.math.BigDecimal
import ru.itmo.restaurantbooking.restaurant.domain.PriceSegment

data class RestaurantSummaryResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val city: String,
    val street: String,
    val building: String,
    val phone: String,
    val priceSegment: PriceSegment,
    val rating: BigDecimal,
    val reviewCount: Int
)
