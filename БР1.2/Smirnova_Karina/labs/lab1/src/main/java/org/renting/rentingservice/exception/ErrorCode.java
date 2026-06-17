package org.renting.rentingservice.exception;

public final class ErrorCode {
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String CONFLICT = "CONFLICT";
    public static final String BUSINESS = "BUSINESS_ERROR";
    public static final String VALIDATION_ERROR = "VALIDATION_ERROR";

    private ErrorCode() {
    }
}
