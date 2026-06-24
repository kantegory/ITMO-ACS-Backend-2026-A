package ru.itmo.restaurantbooking.common.domain

const val DEFAULT_PAGE_SIZE = 10
const val MAX_PAGE_SIZE = 100
const val MAX_PAGE_NUMBER = 100_000
const val MAX_GUESTS_COUNT = 20

fun safeOffset(page: Int, size: Int): Int =
    ((page - 1).toLong() * size.toLong())
        .coerceAtMost(Int.MAX_VALUE.toLong())
        .toInt()
