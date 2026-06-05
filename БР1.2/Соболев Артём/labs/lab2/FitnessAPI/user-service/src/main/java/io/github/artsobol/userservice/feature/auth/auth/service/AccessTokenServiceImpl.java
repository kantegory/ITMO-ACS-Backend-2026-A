package io.github.artsobol.userservice.feature.auth.auth.service;

import io.github.artsobol.common.security.jwt.JwtSubject;
import io.github.artsobol.common.security.jwt.JwtTokenProvider;
import io.github.artsobol.userservice.feature.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessTokenServiceImpl implements AccessTokenService {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public String createAccessToken(User user, UUID sessionId) {
        log.info("Creating access token userId={}", user.getId());
        Set<GrantedAuthority> authorities = Set.of(new SimpleGrantedAuthority(user.getRole().name()));
        JwtSubject subject = new JwtSubject(user.getId(), authorities, user.getUsername(), sessionId);
        String token = jwtTokenProvider.generateToken(subject);

        log.info("Access token created userId={}", user.getId());
        return token;
    }
}
