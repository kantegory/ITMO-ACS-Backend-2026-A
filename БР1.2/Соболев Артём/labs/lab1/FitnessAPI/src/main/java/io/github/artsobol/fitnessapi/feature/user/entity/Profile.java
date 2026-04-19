package io.github.artsobol.fitnessapi.feature.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
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

@Entity
@Table(name = "profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Profile {

    @Id
    @Getter
    private Long id;

    @Getter
    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Getter
    @NotBlank
    @Column(name = "first_name", nullable = false, length = 32)
    private String firstName;

    @Getter
    @NotBlank
    @Column(name = "last_name", nullable = false, length = 32)
    private String lastName;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static Profile create(User user, String firstName, String lastName) {
        Profile entity = new Profile();
        entity.assignUser(user);
        entity.updateFirstName(firstName);
        entity.updateLastName(lastName);
        return entity;
    }

    public void applyPatch(String firstName, String lastName) {
        if (firstName != null) {
            this.updateFirstName(firstName);
        }
        if (lastName != null) {
            this.updateLastName(lastName);
        }
    }

    public void updateFirstName(String firstName) {
        if (firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("FirstName is blank");
        }
        this.firstName = firstName;
    }

    public void updateLastName(String lastName) {
        if (lastName == null || lastName.isBlank()) {
            throw new IllegalArgumentException("LastName is blank");
        }
        this.lastName = lastName;
    }

    private void assignUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User must not be null");
        }
        this.user = user;
    }
}
