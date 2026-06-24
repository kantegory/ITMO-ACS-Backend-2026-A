package io.github.artsobol.fitnessapi.security.jwt;

import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.service.RefreshTokenService;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String header = request.getHeader("Authorization");

            if (checkHeader(header) && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    Claims claims = parseToken(header);
                    validateSession(claims);
                    List<SimpleGrantedAuthority> authorities = getAuthorities(claims);
                    UserPrincipal userPrincipal = createUserPrincipal(claims, authorities);

                    createAuthentication(userPrincipal, authorities);
                    MDC.put("userId", String.valueOf(userPrincipal.userId()));

                    log.debug(
                            "JWT authentication success userId={} username={} authorities={}",
                            userPrincipal.userId(),
                            userPrincipal.username(),
                            authorities
                    );
                } catch (JwtException | IllegalArgumentException e) {
                    SecurityContextHolder.clearContext();
                    log.debug("JWT authentication failed", e);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("userId");
        }
    }

    private void createAuthentication(UserPrincipal userPrincipal, List<SimpleGrantedAuthority> authorities) {
        log.debug("Create authentication userId={} username={}", userPrincipal.userId(), userPrincipal.username());
        Authentication authentication =
                new UsernamePasswordAuthenticationToken(userPrincipal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private UserPrincipal createUserPrincipal(Claims claims, List<SimpleGrantedAuthority> authorities) {
        log.debug("Create user principal from claims");

        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JwtException("Token subject is missing");
        }

        long userId = Long.parseLong(subject);

        String username = claims.get("username", String.class);
        if (username == null || username.isBlank()) {
            throw new JwtException("Token username claim is missing");
        }

        return new UserPrincipal(userId, username, authorities);
    }

    private void validateSession(Claims claims) {
        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JwtException("Token subject is missing");
        }

        String sessionIdClaim = claims.get("sessionId", String.class);
        if (sessionIdClaim == null || sessionIdClaim.isBlank()) {
            throw new JwtException("Token sessionId claim is missing");
        }

        UUID sessionId;
        try {
            sessionId = UUID.fromString(sessionIdClaim);
        } catch (IllegalArgumentException e) {
            throw new JwtException("Token sessionId claim is invalid", e);
        }

        long userId = Long.parseLong(subject);
        if (!refreshTokenService.isSessionActive(userId, sessionId)) {
            throw new JwtException("Session is no longer active");
        }
    }

    private List<SimpleGrantedAuthority> getAuthorities(Claims claims) {
        log.debug("Get authorities from claims");

        Object rolesClaim = claims.get("roles");
        if (!(rolesClaim instanceof List<?> rolesRaw) || rolesRaw.isEmpty()) {
            throw new JwtException("Token roles claim is missing");
        }

        return rolesRaw.stream()
                .map(role -> {
                    if (!(role instanceof String value) || value.isBlank()) {
                        throw new JwtException("Token roles claim contains invalid value");
                    }
                    return new SimpleGrantedAuthority(value);
                })
                .toList();
    }

    private Claims parseToken(String header) {
        log.debug("Parse token from header");
        String token = header.substring(7);
        return jwtTokenProvider.parseToken(token);
    }

    private boolean checkHeader(String header) {
        log.debug("Check valid Authorization header");
        return header != null && header.startsWith("Bearer ");
    }
}
