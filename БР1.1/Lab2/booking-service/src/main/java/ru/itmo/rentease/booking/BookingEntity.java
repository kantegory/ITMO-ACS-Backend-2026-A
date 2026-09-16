package ru.itmo.rentease.booking;

import jakarta.persistence.*;
import ru.itmo.rentease.common.BookingStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class BookingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "tenant_id", nullable = false)
    UUID tenantId;

    @Column(name = "property_id", nullable = false)
    UUID propertyId;

    @Column(name = "landlord_id", nullable = false)
    UUID landlordId;

    @Column(name = "start_date", nullable = false)
    LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    BookingStatus status = BookingStatus.pending;

    @Column(length = 2000)
    String message;

    @Column(name = "created_at", nullable = false)
    OffsetDateTime createdAt = OffsetDateTime.now();
}
