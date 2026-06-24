package ru.itmo.restaurantbooking.lab2.common.exception

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import ru.itmo.restaurantbooking.lab2.common.dto.ErrorResponse

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApiException(
        exception: ApiException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(exception.status)
            .body(
                ErrorResponse(
                    status = exception.status.value(),
                    error = exception.status.reasonPhrase,
                    message = exception.message,
                    path = request.requestURI
                )
            )

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(
        exception: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> {
        val details = exception.bindingResult.fieldErrors
            .map { "${it.field}: ${it.defaultMessage}" }

        return ResponseEntity.badRequest()
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = HttpStatus.BAD_REQUEST.reasonPhrase,
                    message = "Validation failed",
                    path = request.requestURI,
                    details = details
                )
            )
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(
        exception: Exception,
        request: HttpServletRequest
    ): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ErrorResponse(
                    status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    error = HttpStatus.INTERNAL_SERVER_ERROR.reasonPhrase,
                    message = exception.message ?: "Unexpected error",
                    path = request.requestURI
                )
            )
}
