package ru.itmo.restaurantbooking.common.exception

import org.springframework.http.HttpStatus

class BadRequestException(message: String, details: List<String> = emptyList()) : ApiException(HttpStatus.BAD_REQUEST, message, details)
