package com.petproject.propertyservice.entities;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Table(name = "property_image")
@NoArgsConstructor
@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
public class PropertyImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "property_id" ,nullable = false)
    private PropertyEntity propertyId;

    private String url;

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
