package org.renting.rentingservice.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Map;

@Getter
public class ApiException extends RuntimeException {

    private final String code;
    private final HttpStatus status;
    private final Map<String, Object> details;

    public ApiException(String code, String message, HttpStatus status) {
        this(code, message, status, null);
    }

    public ApiException(String code, String message, HttpStatus status, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
    }
}
