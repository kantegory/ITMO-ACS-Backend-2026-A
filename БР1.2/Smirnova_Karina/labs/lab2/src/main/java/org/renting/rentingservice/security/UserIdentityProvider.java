package org.renting.rentingservice.security;

import io.jsonwebtoken.Claims;

public interface UserIdentityProvider {

    UserPrincipal loadPrincipal(Long userId, Claims claims, String rawToken);
}

