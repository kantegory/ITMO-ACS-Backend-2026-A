package ru.itmo.rentease.identity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
public class RefreshTokenEntity {
    @Id
    public UUID id = UUID.randomUUID();
    @Column(name = "user_id", nullable = false)
    public UUID userId;
    @Column(name = "token_hash", nullable = false, unique = true)
    public String tokenHash;
    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;
    @Column(nullable = false)
    public boolean revoked;
}
