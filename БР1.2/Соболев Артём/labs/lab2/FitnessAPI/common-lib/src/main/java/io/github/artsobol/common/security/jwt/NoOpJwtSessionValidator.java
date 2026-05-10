package io.github.artsobol.common.security.jwt;

import java.util.UUID;

public class NoOpJwtSessionValidator implements JwtSessionValidator {

    @Override
    public void validate(long userId, UUID sessionId) {
        // Default validator only checks JWT signature and claims.
    }
}
