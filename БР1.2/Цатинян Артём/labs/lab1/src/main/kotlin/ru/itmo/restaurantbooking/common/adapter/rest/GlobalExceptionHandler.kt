package ru.itmo.restaurantbooking.common.adapter.rest

import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.ConstraintViolationException
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import ru.itmo.restaurantbooking.common.adapter.rest.dto.ErrorResponse
import ru.itmo.restaurantbooking.common.exception.ApiException
import java.time.Instant

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(ApiException::class)
    fun handleApiException(ex: ApiException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(ex.status).body(
            ErrorResponse(
                timestamp = Instant.now().toString(),
                status = ex.status.value(),
                error = ex.status.reasonPhrase,
                message = ex.message,
                path = request.requestURI,
                details = ex.details
            )
        )
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        val details = ex.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.badRequest().body(
            ErrorResponse(
                timestamp = Instant.now().toString(),
                status = 400,
                error = "Bad Request",
                message = "Validation failed",
                path = request.requestURI,
                details = details
            )
        )
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraint(ex: ConstraintViolationException, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        return ResponseEntity.badRequest().body(
            ErrorResponse(
                timestamp = Instant.now().toString(),
                status = 400,
                error = "Bad Request",
                message = "Validation failed",
                path = request.requestURI,
                details = ex.constraintViolations.map { "${it.propertyPath}: ${it.message}" }
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleOther(ex: Exception, request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        return ResponseEntity.internalServerError().body(
            ErrorResponse(
                timestamp = Instant.now().toString(),
                status = 500,
                error = "Internal Server Error",
                message = ex.message ?: "Unexpected error",
                path = request.requestURI
            )
        )
    }
}
