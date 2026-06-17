package org.renting.rentingservice.exception;

import org.springframework.http.HttpStatus;

public class BusinessException extends ApiException {
    public BusinessException(String message) {
        super(ErrorCode.BUSINESS, message, HttpStatus.BAD_REQUEST);
    }
}
