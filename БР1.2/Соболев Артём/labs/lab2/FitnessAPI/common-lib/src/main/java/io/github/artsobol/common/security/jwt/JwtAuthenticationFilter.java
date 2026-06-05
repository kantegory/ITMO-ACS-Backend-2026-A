package io.github.artsobol.common.security.jwt;

import io.github.artsobol.common.security.user.UserPrincipal;
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
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final JwtSessionValidator jwtSessionValidator;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String header = request.getHeader(AUTHORIZATION_HEADER);

            if (hasBearerToken(header) && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    Claims claims = parseToken(header);
                    long userId = extractUserId(claims);
                    String username = extractUsername(claims);
                    UUID sessionId = extractSessionId(claims);
                    jwtSessionValidator.validate(userId, sessionId);

                    List<SimpleGrantedAuthority> authorities = extractAuthorities(claims);
                    UserPrincipal userPrincipal = new UserPrincipal(userId, username, authorities);

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
        Authentication authentication =
                new UsernamePasswordAuthenticationToken(userPrincipal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private long extractUserId(Claims claims) {
        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JwtException("Token subject is missing");
        }

        try {
            return Long.parseLong(subject);
        } catch (NumberFormatException e) {
            throw new JwtException("Token subject is invalid", e);
        }
    }

    private String extractUsername(Claims claims) {
        String username = claims.get("username", String.class);
        if (username == null || username.isBlank()) {
            throw new JwtException("Token username claim is missing");
        }
        return username;
    }

    private UUID extractSessionId(Claims claims) {
        String sessionIdClaim = claims.get("sessionId", String.class);
        if (sessionIdClaim == null || sessionIdClaim.isBlank()) {
            throw new JwtException("Token sessionId claim is missing");
        }

        try {
            return UUID.fromString(sessionIdClaim);
        } catch (IllegalArgumentException e) {
            throw new JwtException("Token sessionId claim is invalid", e);
        }
    }

    private List<SimpleGrantedAuthority> extractAuthorities(Claims claims) {
        Object rolesClaim = claims.get("roles");
        if (!(rolesClaim instanceof Collection<?> rolesRaw) || rolesRaw.isEmpty()) {
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
        String token = header.substring(BEARER_PREFIX.length());
        return jwtTokenProvider.parseToken(token);
    }

    private boolean hasBearerToken(String header) {
        return header != null && header.startsWith(BEARER_PREFIX);
    }
}
