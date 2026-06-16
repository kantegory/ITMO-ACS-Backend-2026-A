package ru.itmo.restaurantbooking.common.exception

import org.springframework.http.HttpStatus

class ConflictException(message: String, details: List<String> = emptyList()) : ApiException(HttpStatus.CONFLICT, message, details)
