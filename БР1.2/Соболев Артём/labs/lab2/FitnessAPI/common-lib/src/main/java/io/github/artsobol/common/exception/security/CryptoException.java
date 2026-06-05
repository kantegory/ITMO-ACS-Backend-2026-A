package io.github.artsobol.common.exception.security;

import io.github.artsobol.common.exception.base.BaseException;
import org.springframework.http.HttpStatus;

import java.util.Map;

public class CryptoException extends BaseException {
    public CryptoException(String messageKey, Object... messageArgs) {
        super(messageKey, messageKey, HttpStatus.INTERNAL_SERVER_ERROR, Map.of(), null, messageArgs);
    }

    public CryptoException(String messageKey, Throwable cause, Object... messageArgs) {
        super(messageKey, messageKey, HttpStatus.INTERNAL_SERVER_ERROR, Map.of(), cause, messageArgs);
    }
}
