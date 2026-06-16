package org.renting.rentingservice.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends ApiException {
    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
    }
}
