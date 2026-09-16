package ru.itmo.rentease.property;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "rental_conditions")
public class RentalConditionEntity {
    @Id
    public UUID id = UUID.randomUUID();
    @Column(name = "property_id", nullable = false, unique = true)
    public UUID propertyId;
    @Column(name = "minimum_months", nullable = false)
    public int minimumMonths = 1;
    @Column(name = "utilities_included", nullable = false)
    public boolean utilitiesIncluded;
    @Column(name = "pets_allowed", nullable = false)
    public boolean petsAllowed;
    @Column(length = 2000)
    public String notes;
}
