package io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.entity;

import io.github.artsobol.fitnessapi.feature.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "password_reset_token")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static PasswordResetToken create(User user, String tokenHash, Instant expiresAt) {
        PasswordResetToken entity = new PasswordResetToken();
        entity.user = user;
        entity.tokenHash = tokenHash;
        entity.expiresAt = expiresAt;

        return entity;
    }

    public void setRevokedAt(Instant revokedAt) {
        if (revokedAt == null) {
            throw new IllegalArgumentException("revoked at must not be null");
        }
        this.revokedAt = revokedAt;
    }

    public void setUsedAt(Instant usedAt) {
        if (usedAt == null) {
            throw new IllegalArgumentException("revoked at must not be null");
        }
        this.usedAt = usedAt;
    }
}
