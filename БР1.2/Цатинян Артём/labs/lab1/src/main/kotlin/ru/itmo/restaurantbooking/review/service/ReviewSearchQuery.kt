package ru.itmo.restaurantbooking.review.service

import ru.itmo.restaurantbooking.common.domain.SortDirection

data class ReviewSearchQuery(
    val page: Int,
    val size: Int,
    val sortDirection: SortDirection
)
