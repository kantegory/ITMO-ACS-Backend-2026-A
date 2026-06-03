package com.petproject.paymentservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.access.secret}")
    private String accessSecret;


    private SecretKey getAccessSigningKey() {
        byte[] keyBytes = accessSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsernameFromAccessToken(String token) {
        return extractClaimFromAccessToken(token, claims ->  claims.get("username", String.class));
    }

    public <T> T extractClaimFromAccessToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaimsFromAccessToken(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaimsFromAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(getAccessSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            extractAllClaimsFromAccessToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isAccessTokenExpired(String token) {
        return extractExpirationFromAccessToken(token).before(new Date());
    }

    private Date extractExpirationFromAccessToken(String token) {
        return extractClaimFromAccessToken(token, Claims::getExpiration);
    }

    public Long extractUserId(String token) {
        Claims claims = extractAllClaimsFromAccessToken(token);
        return claims.get("userId", Long.class);
    }

    public String extractUsername(String token) {
        return extractClaimFromAccessToken(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaimFromAccessToken(token, claims ->  claims.get("role", String.class));
    }

    public Boolean extractIsRenter(String token) {
        return extractClaimFromAccessToken(token, claims ->  claims.get("isRenter", Boolean.class));
    }

    public Boolean extractIsLandlord(String token) {
        return extractClaimFromAccessToken(token, claims ->  claims.get("isLandlord", Boolean.class));
    }


}
