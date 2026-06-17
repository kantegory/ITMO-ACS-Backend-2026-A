package org.renting.rentingservice.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("user")
@RequiredArgsConstructor
public class LocalUserIdentityProvider implements UserIdentityProvider {

    private final CustomUserDetailsService userDetailsService;

    @Override
    public UserPrincipal loadPrincipal(Long userId, Claims claims, String rawToken) {
        return (UserPrincipal) userDetailsService.loadById(userId);
    }
}

