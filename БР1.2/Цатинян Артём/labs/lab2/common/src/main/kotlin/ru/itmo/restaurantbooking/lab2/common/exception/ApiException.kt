package ru.itmo.restaurantbooking.lab2.common.exception

import org.springframework.http.HttpStatus

open class ApiException(
    val status: HttpStatus,
    override val message: String
) : RuntimeException(message)

class BadRequestException(message: String) : ApiException(HttpStatus.BAD_REQUEST, message)

class UnauthorizedException(message: String) : ApiException(HttpStatus.UNAUTHORIZED, message)

class ForbiddenException(message: String) : ApiException(HttpStatus.FORBIDDEN, message)

class NotFoundException(message: String) : ApiException(HttpStatus.NOT_FOUND, message)

class ConflictException(message: String) : ApiException(HttpStatus.CONFLICT, message)

class UnprocessableEntityException(message: String) : ApiException(HttpStatus.UNPROCESSABLE_ENTITY, message)
