package ru.itmo.restaurantbooking.common.exception

import org.springframework.http.HttpStatus

open class ApiException(
    val status: HttpStatus,
    override val message: String,
    val details: List<String> = emptyList()
) : RuntimeException(message)
