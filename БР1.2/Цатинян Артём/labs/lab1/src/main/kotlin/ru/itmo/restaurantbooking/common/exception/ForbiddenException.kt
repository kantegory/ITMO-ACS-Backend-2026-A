package ru.itmo.restaurantbooking.common.exception

import org.springframework.http.HttpStatus

class ForbiddenException(message: String) : ApiException(HttpStatus.FORBIDDEN, message)
