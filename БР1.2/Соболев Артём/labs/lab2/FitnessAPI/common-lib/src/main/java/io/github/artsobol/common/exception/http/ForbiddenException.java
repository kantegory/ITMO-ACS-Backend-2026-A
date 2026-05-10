package io.github.artsobol.common.exception.http;

import io.github.artsobol.common.exception.base.BaseException;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class ForbiddenException extends BaseException {

    public ForbiddenException(String messageKey, Object... args) {
        super(messageKey, messageKey, HttpStatus.FORBIDDEN, Map.of(), null, args);
    }
}
