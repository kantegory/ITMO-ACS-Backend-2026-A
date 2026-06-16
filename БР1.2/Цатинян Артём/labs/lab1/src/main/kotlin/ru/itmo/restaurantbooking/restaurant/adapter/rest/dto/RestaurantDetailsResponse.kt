package ru.itmo.restaurantbooking.restaurant.adapter.rest.dto

import java.math.BigDecimal
import ru.itmo.restaurantbooking.restaurant.domain.PriceSegment

data class RestaurantDetailsResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val city: String,
    val street: String,
    val building: String,
    val phone: String,
    val priceSegment: PriceSegment,
    val bookingPolicy: String?,
    val cuisines: List<String>,
    val workingHours: List<WorkingHoursResponse>,
    val photos: List<RestaurantPhotoResponse>,
    val rating: BigDecimal,
    val reviewCount: Int
)
