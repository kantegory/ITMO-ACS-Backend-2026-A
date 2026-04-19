package io.github.artsobol.fitnessapi.feature.auth.refreshtoken.entity;

import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.request.CreateRefreshTokenRequest;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "refresh_token", indexes = {
        @Index(name = "idx_refresh_token_user_id", columnList = "user_id"),
        @Index(name = "idx_refresh_token_session_id", columnList = "session_id"),
        @Index(name = "idx_refresh_token_token_hash", columnList = "token_hash")
})
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class RefreshToken {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, unique = true)
    private Long id;

    @Getter
    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_refresh_token_user_id"))
    private User user;

    @Getter
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Getter
    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "revoked_reason")
    private RevokedReason revokedReason;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replace_by_id", unique = true)
    private RefreshToken replaceBy;

    @OneToOne(mappedBy = "replaceBy")
    private RefreshToken replacedToken;

    @Getter
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @NotBlank
    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @NotBlank
    @Column(name = "user_agent", nullable = false)
    private String userAgent;

    @Getter
    @Column(name = "device_name")
    private String deviceName;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "last_used_at", nullable = false)
    private Instant lastUsedAt;

    public static RefreshToken create(CreateRefreshTokenRequest request, String tokenHash, Instant expiresAt) {
        RefreshToken entity = new RefreshToken();
        entity.tokenHash = Objects.requireNonNull(tokenHash, "Token hash is null");
        entity.expiresAt = Objects.requireNonNull(expiresAt, "ExpiresAt is null");
        entity.user = request.user();
        entity.sessionId = request.sessionId();
        entity.ipAddress = request.ipAddress();
        entity.userAgent = request.userAgent();
        entity.deviceName = request.deviceName();

        return entity;
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpiredAt(Instant now) {
        return expiresAt.isBefore(now);
    }

    public void revoke(Instant now, RevokedReason reason) {
        this.revokedAt = now;
        this.revokedReason = reason;
    }

    public void replaceWith(RefreshToken newToken, Instant now) {
        revoke(now, RevokedReason.ROTATED);
        this.replaceBy = newToken;
        newToken.replacedToken = this;
    }

}
