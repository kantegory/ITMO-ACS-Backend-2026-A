package ru.itmo.rentease.property;

import jakarta.persistence.*;
import ru.itmo.rentease.common.PropertyType;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "properties")
public class PropertyEntity {
    @Id
    public UUID id = UUID.randomUUID();
    @Column(name = "landlord_id", nullable = false)
    public UUID landlordId;
    @Column(nullable = false)
    public String title;
    @Column(nullable = false, length = 10000)
    public String description;
    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false)
    public PropertyType propertyType;
    @Column(name = "price_per_month", nullable = false, precision = 14, scale = 2)
    public BigDecimal pricePerMonth;
    @Column(name = "security_deposit", nullable = false, precision = 14, scale = 2)
    public BigDecimal securityDeposit = BigDecimal.ZERO;
    @Column(nullable = false)
    public String city;
    @Column(nullable = false)
    public String address;
    @Column(name = "rooms_count")
    public Integer roomsCount;
    @Column(name = "area_sqm", precision = 12, scale = 2)
    public BigDecimal areaSqm;
    @Column(name = "is_active", nullable = false)
    public boolean active = true;
}
