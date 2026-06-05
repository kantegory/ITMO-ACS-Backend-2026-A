package io.github.artsobol.common.security.jwt;

import java.util.UUID;

@FunctionalInterface
public interface JwtSessionValidator {

    void validate(long userId, UUID sessionId);
}
