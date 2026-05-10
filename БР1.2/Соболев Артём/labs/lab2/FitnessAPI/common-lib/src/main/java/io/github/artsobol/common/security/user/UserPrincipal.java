package io.github.artsobol.common.security.user;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public record UserPrincipal(
        long userId,
        String username,
        Collection<? extends GrantedAuthority> authorities
) {
}
