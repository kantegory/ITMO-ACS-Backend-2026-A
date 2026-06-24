package io.github.artsobol.fitnessapi.security.jwt;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.UUID;

public record JwtSubject(
        Long userId,
        Collection<? extends GrantedAuthority> authorities,
        String username,
        UUID sessionId
) {
}
