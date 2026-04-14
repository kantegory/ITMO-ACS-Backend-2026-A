package ru.itmo.restaurantbooking.common.domain

data class PageResult<T>(
    val items: List<T>,
    val totalItems: Long
) {
    fun totalPages(size: Int): Int = if (totalItems == 0L) 0 else kotlin.math.ceil(totalItems.toDouble() / size.toDouble()).toInt()
}
