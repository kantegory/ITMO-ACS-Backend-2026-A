package ru.itmo.pxdkxvan.lab23.interaction.common

import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(ex: NoSuchElementException): ResponseEntity<Map<String, String>> =
        response(HttpStatus.NOT_FOUND, ex.message ?: "Not found")

    @ExceptionHandler(IllegalArgumentException::class, IllegalStateException::class)
    fun handleIllegal(ex: RuntimeException): ResponseEntity<Map<String, String>> =
        response(resolveStatus(ex.message), ex.message ?: "Request failed")

    @ExceptionHandler(DataIntegrityViolationException::class)
    fun handleConflict(ex: DataIntegrityViolationException): ResponseEntity<Map<String, String>> =
        response(HttpStatus.CONFLICT, ex.mostSpecificCause.message ?: "Conflict")

    private fun response(status: HttpStatus, message: String) = ResponseEntity.status(status).body(mapOf("message" to message))

    private fun resolveStatus(message: String?): HttpStatus {
        val normalized = message?.lowercase().orEmpty()
        return when {
            "already in favorites" in normalized -> HttpStatus.CONFLICT
            "vacancy is not published" in normalized -> HttpStatus.BAD_REQUEST
            "not found" in normalized -> HttpStatus.NOT_FOUND
            else -> HttpStatus.BAD_REQUEST
        }
    }
}
