package io.github.artsobol.common.exception.http;

import io.github.artsobol.common.exception.base.BaseException;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class BadRequestException extends BaseException {

    public BadRequestException(String messageKey, Object... args) {
        super(messageKey, messageKey, HttpStatus.BAD_REQUEST, Map.of(), null, args);
    }
}
