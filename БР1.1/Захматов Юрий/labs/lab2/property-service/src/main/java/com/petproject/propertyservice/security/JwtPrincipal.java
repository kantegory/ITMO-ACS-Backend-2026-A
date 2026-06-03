package com.petproject.propertyservice.security;

import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import javax.security.auth.Subject;
import java.security.Principal;
import java.util.Collection;
import java.util.List;

@Builder
@Getter
public class JwtPrincipal implements Principal {

    private final Long userId;
    private final String username;
    private final String role;
    private final Boolean isLandlord;
    private final Boolean isRenter;

    public JwtPrincipal(Long userId, String username, String role, Boolean isLandlord, Boolean isRenter) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.isLandlord = isLandlord;
        this.isRenter = isRenter;
    }

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
