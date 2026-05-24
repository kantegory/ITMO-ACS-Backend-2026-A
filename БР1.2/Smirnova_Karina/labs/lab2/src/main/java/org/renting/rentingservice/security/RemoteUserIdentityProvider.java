package org.renting.rentingservice.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!user & !notification")
@RequiredArgsConstructor
public class RemoteUserIdentityProvider implements UserIdentityProvider {

    @Override
    public UserPrincipal loadPrincipal(Long userId, Claims claims, String rawToken) {
        String email = claims.get("email", String.class);
        return UserPrincipal.minimal(userId, email);
    }
}

