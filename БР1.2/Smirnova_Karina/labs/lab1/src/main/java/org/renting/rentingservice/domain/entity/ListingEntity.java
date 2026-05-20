package org.renting.rentingservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;
import org.renting.rentingservice.domain.enums.HouseType;
import org.renting.rentingservice.domain.enums.RentMode;

import java.time.Instant;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private UserEntity owner;

    @Enumerated(EnumType.STRING)
    @Column(name = "rent_mode", nullable = false, length = 16)
    private RentMode rentMode;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(columnDefinition = "geometry(Point,4326)")
    @JdbcTypeCode(SqlTypes.GEOMETRY)
    private Point location;

    @Enumerated(EnumType.STRING)
    @Column(name = "house_type", nullable = false, length = 32)
    private HouseType houseType;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToOne(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    private ListingDailyEntity daily;

    @OneToOne(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    private ListingMonthlyEntity monthly;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
