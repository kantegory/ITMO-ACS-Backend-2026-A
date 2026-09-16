package ru.itmo.rentease.contract;

import jakarta.persistence.*;
import ru.itmo.rentease.common.ContractStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "rental_contracts")
public class RentalContractEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "booking_id", nullable = false, unique = true)
    UUID bookingId;

    @Column(name = "property_id", nullable = false)
    UUID propertyId;

    @Column(name = "tenant_id", nullable = false)
    UUID tenantId;

    @Column(name = "landlord_id", nullable = false)
    UUID landlordId;

    @Column(name = "contract_number", nullable = false, unique = true, length = 40)
    String contractNumber;

    @Column(name = "monthly_rent", nullable = false, precision = 12, scale = 2)
    BigDecimal monthlyRent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    ContractStatus status = ContractStatus.active;

    @Column(name = "created_at", nullable = false)
    OffsetDateTime createdAt = OffsetDateTime.now();
}
