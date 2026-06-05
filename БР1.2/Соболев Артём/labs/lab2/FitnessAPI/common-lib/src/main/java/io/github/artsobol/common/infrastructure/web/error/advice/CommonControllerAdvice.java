package io.github.artsobol.common.infrastructure.web.error.advice;

import io.github.artsobol.common.exception.base.BaseException;
import io.github.artsobol.common.infrastructure.localization.MessageService;
import io.github.artsobol.common.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.common.infrastructure.web.error.dto.ValidationErrorResponse;
import io.github.artsobol.common.infrastructure.web.error.dto.ValidationFieldError;
import io.github.artsobol.common.utils.MessageKeyUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class CommonControllerAdvice {

    private final MessageService messageService;

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.BAD_REQUEST;

        List<ValidationFieldError> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> new ValidationFieldError(err.getField(), messageService.resolveValidationMessage(err)))
                .toList();

        String message = messageService.createMessage("validation.error", null);

        ValidationErrorResponse response = new ValidationErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                errors
        );
        log.warn("Validation error for request URI: {}. Errors: {}", request.getRequestURI(), errors);

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.FORBIDDEN;
        String message = messageService.createMessage("auth.access.denied", null);

        ErrorResponse response = new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "ACCESS_DENIED",
                message,
                request.getRequestURI()
        );

        log.warn(
                "Access denied: method={}, URI={}, status={}, errorCode={}",
                request.getMethod(),
                request.getRequestURI(),
                status.value(),
                "ACCESS_DENIED"
        );

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ValidationErrorResponse> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.BAD_REQUEST;

        List<String> missingParams = Arrays.asList(ex.getParameterName().split(","));
        List<ValidationFieldError> errors = missingParams.stream()
                .map(param -> {
                    String localizedMessage = messageService.createMessage("parameter.missing", new Object[]{param});
                    return new ValidationFieldError(param, localizedMessage);
                }).toList();

        String message = messageService.createMessage("parameter.missing.base", null);

        ValidationErrorResponse response = new ValidationErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                errors
        );

        log.warn(
                "Missing request parameters for URI: {}. Missing parameters: {}",
                request.getRequestURI(),
                missingParams
        );

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        String message = messageService.createMessage(ex.getMessageKey(), ex.getMessageArgs());

        ErrorResponse response = getErrorResponse(request, status, ex.getErrorCode(), message);
        log.warn(
                "Request failed: method={}, URI={}, status={}, error code={}",
                request.getMethod(),
                request.getRequestURI(),
                status.value(),
                ex.getErrorCode()
        );

        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = messageService.createMessage("unexpected.error", null);

        ErrorResponse response = getErrorResponse(request, status, "INTERNAL_SERVER_ERROR", message);
        log.error(
                "Unexpected error: method={}, URI={}, status={}, errorCode={}",
                request.getMethod(),
                request.getRequestURI(),
                500,
                "INTERNAL_SERVER_ERROR",
                ex
        );

        return ResponseEntity.status(status).body(response);
    }

    private static @NonNull ErrorResponse getErrorResponse(
            HttpServletRequest request,
            HttpStatus status,
            String errorCode,
            String message
    ) {
        return new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                MessageKeyUtils.normalize(errorCode),
                message,
                request.getRequestURI()
        );
    }
}
