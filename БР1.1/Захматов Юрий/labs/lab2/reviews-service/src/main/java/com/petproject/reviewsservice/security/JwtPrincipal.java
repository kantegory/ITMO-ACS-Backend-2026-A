package com.petproject.reviewsservice.security;

import lombok.Builder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import javax.security.auth.Subject;
import java.security.Principal;
import java.util.Collection;
import java.util.List;

@Builder
public record JwtPrincipal(
        Long userId,
        String username,
        String role,
        Boolean isLandlord,
        Boolean isRenter
) implements Principal {

    @Override
    public String getName() {
        return username;
    }

    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public boolean implies(Subject subject) {
        return Principal.super.implies(subject);
    }
}
