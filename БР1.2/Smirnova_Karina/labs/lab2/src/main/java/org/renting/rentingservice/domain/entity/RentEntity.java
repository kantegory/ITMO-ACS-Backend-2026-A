package org.renting.rentingservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.renting.rentingservice.domain.enums.CommunicationMethod;
import org.renting.rentingservice.domain.enums.RentStatus;

import java.time.Instant;

@Entity
@Table(name = "rents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private ListingEntity listing;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guest_id", nullable = false)
    private UserEntity guest;

    @Enumerated(EnumType.STRING)
    @Column(name = "communication_method", nullable = false, length = 16)
    private CommunicationMethod communicationMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RentStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
