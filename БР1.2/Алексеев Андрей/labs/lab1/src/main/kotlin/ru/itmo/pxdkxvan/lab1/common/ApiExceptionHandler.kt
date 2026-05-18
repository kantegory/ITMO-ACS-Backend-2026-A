package ru.itmo.pxdkxvan.lab1.common

import jakarta.validation.ConstraintViolationException
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {
    private val logger = LoggerFactory.getLogger(ApiExceptionHandler::class.java)

    @ExceptionHandler(ApiException::class)
    fun handleApiException(exception: ApiException): ResponseEntity<ErrorResponse> {
        logger.error("API exception: status={}, error={}, message={}", exception.status.value(), exception.error, exception.message, exception)
        return ResponseEntity
            .status(exception.status)
            .body(ErrorResponse(exception.error, exception.message, exception.details))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleMethodArgumentNotValid(exception: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        logger.error("Method argument validation failed", exception)
        val details = exception.bindingResult
            .allErrors
            .map { error ->
                val field = (error as? FieldError)?.field ?: error.objectName
                ErrorDetail(field, error.defaultMessage ?: "Validation error")
            }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(ApiErrorCode.VALIDATION, "Validation failed", details))
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraintViolation(exception: ConstraintViolationException): ResponseEntity<ErrorResponse> {
        logger.error("Constraint validation failed", exception)
        val details = exception.constraintViolations.map {
            ErrorDetail(it.propertyPath.toString(), it.message)
        }
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(ApiErrorCode.VALIDATION, "Validation failed", details))
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleMessageNotReadable(exception: HttpMessageNotReadableException): ResponseEntity<ErrorResponse> {
        logger.error("Request body parsing failed", exception)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(ApiErrorCode.VALIDATION, "Validation failed"))
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(exception: AccessDeniedException): ResponseEntity<ErrorResponse> {
        logger.error("Access denied", exception)
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse(ApiErrorCode.FORBIDDEN, "Access denied"))
    }

    @ExceptionHandler(Exception::class)
    fun handleException(exception: Exception): ResponseEntity<ErrorResponse> {
        logger.error("Unexpected exception", exception)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse(ApiErrorCode.INTERNAL, exception.message ?: "Unexpected error"))
    }
}
