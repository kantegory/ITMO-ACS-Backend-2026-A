package org.renting.rentingservice.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends ApiException {
    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
    }
}
