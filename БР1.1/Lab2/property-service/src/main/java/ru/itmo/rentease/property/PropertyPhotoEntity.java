package ru.itmo.rentease.property;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "property_photos")
public class PropertyPhotoEntity {
    @Id
    public UUID id = UUID.randomUUID();
    @Column(name = "property_id", nullable = false)
    public UUID propertyId;
    @Column(name = "content_type", nullable = false)
    public String contentType;
    @Column(nullable = false)
    public byte[] content;
}
