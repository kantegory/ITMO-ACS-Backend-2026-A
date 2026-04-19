package io.github.artsobol.fitnessapi.exception.security;

import io.github.artsobol.fitnessapi.exception.base.BaseException;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class CryptoException extends BaseException {
    public CryptoException(String messageKey, Object... messageArgs) {
        super(messageKey, messageKey, HttpStatus.INTERNAL_SERVER_ERROR, Map.of(), null, messageArgs);
    }
}
