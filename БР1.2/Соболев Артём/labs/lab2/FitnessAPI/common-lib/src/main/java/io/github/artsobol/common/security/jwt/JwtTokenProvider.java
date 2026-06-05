package io.github.artsobol.common.security.jwt;

import io.github.artsobol.common.config.properties.security.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.GrantedAuthority;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.util.Date;
import java.util.stream.Collectors;

public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final Duration accessTokenExpiration;

    public JwtTokenProvider(JwtProperties properties) {
        byte[] keyBytes = Decoders.BASE64.decode(properties.secret());
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpiration = properties.accessTokenExpiration();
    }

    public String generateToken(JwtSubject subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration.toMillis());

        return Jwts.builder()
                .subject(subject.userId().toString())
                .claim(
                        "roles",
                        subject.authorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet())
                )
                .claim("username", subject.username())
                .claim("sessionId", subject.sessionId().toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }
}
