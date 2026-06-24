package io.github.artsobol.fitnessapi.feature.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @Getter
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Column(name = "username", nullable = false, unique = true)

    private String username;

    @Getter
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "email_verified_at") private Instant emailVerifiedAt;

    @Getter
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Getter
    @Column(name = "is_active")
    private boolean isActive = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static User create(String username, String email, String passwordHash) {
        User entity = new User();
        entity.changeUsername(username);
        entity.changeEmail(email);
        entity.changePasswordHash(passwordHash);
        entity.changeRole(Role.USER);

        return entity;
    }

    public void changeUsername(String username) {
        String normalizedUsername = Objects.requireNonNull(username, "username must not be null").strip();
        if (normalizedUsername.isEmpty()) {
            throw new IllegalArgumentException("username must not be blank");
        }
        this.username = normalizedUsername;
    }

    public void changeEmail(String email) {
        String normalizedEmail = Objects.requireNonNull(email, "email must not be null").strip().toLowerCase();
        if (normalizedEmail.isEmpty()) {
            throw new IllegalArgumentException("email must not be blank");
        }
        this.email = normalizedEmail;
    }

    public void changePasswordHash(String passwordHash) {
        String normalizedPasswordHash = Objects.requireNonNull(passwordHash, "password hash must not be null").strip();
        if (normalizedPasswordHash.isEmpty()) {
            throw new IllegalArgumentException("password hash must not be blank");
        }
        this.passwordHash = normalizedPasswordHash;
    }

    public void changeRole(Role role) {
        Objects.requireNonNull(role, "Role must not be null");
        this.role = role;
    }

    public void verifyEmail() {
        if (this.emailVerifiedAt != null) {
            throw new IllegalArgumentException("User email already verified");
        }
        this.emailVerifiedAt = Instant.now();
    }
}

