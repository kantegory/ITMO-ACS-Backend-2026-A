package ru.itmo.rentease.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(AppException.class)
    ResponseEntity<ApiDtos.ErrorResponse> app(AppException ex, HttpServletRequest request) {
        return ResponseEntity.status(ex.status()).body(error(ex.code(), ex.getMessage(), request));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiDtos.ErrorResponse> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream().findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage()).orElse("Invalid request body");
        return ResponseEntity.badRequest().body(error("VALIDATION_ERROR", message, request));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiDtos.ErrorResponse> unreadable(HttpServletRequest request) {
        return ResponseEntity.badRequest().body(error("VALIDATION_ERROR", "Invalid JSON request body", request));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiDtos.ErrorResponse> illegal(IllegalArgumentException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(error("INVALID_REQUEST", ex.getMessage(), request));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiDtos.ErrorResponse> generic(HttpServletRequest request) {
        return ResponseEntity.internalServerError().body(error("INTERNAL_ERROR", "Unexpected server error", request));
    }

    private ApiDtos.ErrorResponse error(String code, String message, HttpServletRequest request) {
        String traceId = request.getHeader("X-Request-Id");
        if (traceId == null || traceId.isBlank()) traceId = java.util.UUID.randomUUID().toString();
        return new ApiDtos.ErrorResponse(code, message, traceId);
    }
}
