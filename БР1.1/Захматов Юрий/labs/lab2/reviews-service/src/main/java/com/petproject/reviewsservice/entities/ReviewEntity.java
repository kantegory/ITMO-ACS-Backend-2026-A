package com.petproject.reviewsservice.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Table(name = "review")
@Entity
@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class ReviewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name="user_id", nullable = false)
    private Long userId;

    @Column(name="property_id", nullable = false)
    private Long propertyId;

    @Column(nullable = false)
    private Integer rating;

    private String comment;

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
