package io.github.artsobol.fitnessapi.exception.http;

import io.github.artsobol.fitnessapi.exception.base.BaseException;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class ConflictException extends BaseException {

    public ConflictException(String messageKey, Object... args) {
        super(messageKey, messageKey, HttpStatus.CONFLICT, Map.of(), null, args);
    }
}
