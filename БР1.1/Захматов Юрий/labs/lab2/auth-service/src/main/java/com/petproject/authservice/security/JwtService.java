package com.petproject.authservice.security;

import com.petproject.authservice.entities.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.access.secret}")
    private String accessSecret;

    @Value("${jwt.access.expiration}")
    private Long accessExpirationTime;

    @Value("${jwt.refresh.secret}")
    private String refreshSecret;

    @Value("${jwt.refresh.expiration}")
    private Long refreshExpirationTime;

    public String generateAccessToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "access");
        claims.put("userId", user.getId());
        claims.put("role", user.getGlobalRole().name());
        claims.put("username", user.getUsername());
        claims.put("isRenter", user.getIsRenter());
        claims.put("isLandlord", user.getIsLandlord());
        return createAccessToken(claims, user.getUsername());
    }

    private String createAccessToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + accessExpirationTime))
                .signWith(getAccessSigningKey())
                .compact();
    }

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

    public Boolean validateAccessToken(String token, UserDetails user) {
        final String username = extractClaimFromAccessToken(token, Claims::getSubject);
        return ((user.getUsername().equals(username)) && !isAccessTokenExpired(token));
    }

    private boolean isAccessTokenExpired(String token) {
        return extractExpirationFromAccessToken(token).before(new Date());
    }

    private Date extractExpirationFromAccessToken(String token) {
        return extractClaimFromAccessToken(token, Claims::getExpiration);
    }

    public String generateRefreshToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("userId", user.getId());
        return createRefreshToken(claims, user.getUsername());
    }

    private String createRefreshToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + refreshExpirationTime))
                .signWith(getRefreshSigningKey())
                .compact();
    }

    private SecretKey getRefreshSigningKey() {
        byte[] keyBytes = refreshSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Claims extractAllClaimsFromRefreshToken(String token) {
        return Jwts.parser()
                .verifyWith(getRefreshSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
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


}
