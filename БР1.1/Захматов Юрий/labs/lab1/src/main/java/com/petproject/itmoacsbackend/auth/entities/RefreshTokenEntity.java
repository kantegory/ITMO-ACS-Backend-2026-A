package com.petproject.itmoacsbackend.auth.entities;

import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_refresh_token")
    @SequenceGenerator(
            sequenceName = "seq_refresh_token",
            name = "seq_refresh_token",
            allocationSize = 5
    )
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Builder.Default
    public Boolean revoked = false;

    public Boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
