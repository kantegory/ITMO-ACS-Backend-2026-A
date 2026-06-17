package ru.itmo.restaurantbooking.restaurant.service

import java.time.LocalDate

data class RestaurantAvailabilityQuery(
    val date: LocalDate,
    val guestsCount: Int
)
