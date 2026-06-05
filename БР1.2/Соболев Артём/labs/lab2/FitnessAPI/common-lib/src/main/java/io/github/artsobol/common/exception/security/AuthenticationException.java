package io.github.artsobol.common.exception.security;

import io.github.artsobol.common.exception.base.BaseException;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class AuthenticationException extends BaseException {
    public AuthenticationException(String messageKey, Object... messageArgs) {
        super(messageKey, messageKey, HttpStatus.UNAUTHORIZED, Map.of(), null, messageArgs);
    }

    public AuthenticationException(String messageKey, Throwable cause, Object... messageArgs) {
        super(messageKey, messageKey, HttpStatus.UNAUTHORIZED, Map.of(), cause, messageArgs);
    }
}
