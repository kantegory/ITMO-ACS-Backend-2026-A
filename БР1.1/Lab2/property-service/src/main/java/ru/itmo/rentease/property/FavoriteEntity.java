package ru.itmo.rentease.property;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "favorites", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "property_id"}))
public class FavoriteEntity {
    @Id
    public UUID id = UUID.randomUUID();
    @Column(name = "user_id", nullable = false)
    public UUID userId;
    @Column(name = "property_id", nullable = false)
    public UUID propertyId;
}
