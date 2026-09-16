package ru.itmo.rentease.common;

import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public AppException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }
    public static AppException badRequest(String message) { return new AppException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message); }
    public static AppException unauthorized(String message) { return new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message); }
    public static AppException forbidden(String message) { return new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", message); }
    public static AppException notFound(String message) { return new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND", message); }
    public static AppException conflict(String message) { return new AppException(HttpStatus.CONFLICT, "CONFLICT", message); }
    public static AppException unavailable(String message) { return new AppException(HttpStatus.SERVICE_UNAVAILABLE, "DEPENDENCY_UNAVAILABLE", message); }
}
