package com.petproject.propertyservice.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Table(name = "property")
@Entity
@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class PropertyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToMany
    @Builder.Default
    @JoinTable(
            name = "property_amenity_link",
            joinColumns = @JoinColumn(name = "property_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    private Set<AmenityEntity> amenities = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "propertyId",  cascade = CascadeType.ALL,  orphanRemoval = true)
    private List<PropertyImageEntity> propertyImages =  new ArrayList<>();

    @Column(nullable = false)
    private String title;

    private String description;

    @Builder.Default
    private Integer totalReviews = 0;

    @Builder.Default
    private Integer ratingSum = 0;

    @Builder.Default
    private Double avgRating = 0.0;

    @Column(nullable = false)
    private Float price;

    @Column(nullable = false)
    private Float square;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private String region;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String street;

    @Column(nullable = false)
    private String postalCode;

    @Column(nullable = false)
    private String mainImage;

    private String nearestSubway;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    private Boolean available = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
