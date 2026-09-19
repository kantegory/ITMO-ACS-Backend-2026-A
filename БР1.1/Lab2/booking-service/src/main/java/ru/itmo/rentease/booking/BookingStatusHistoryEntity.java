package ru.itmo.rentease.booking;

import jakarta.persistence.*;
import ru.itmo.rentease.common.BookingStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "booking_status_history")
public class BookingStatusHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "booking_id", nullable = false)
    UUID bookingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    BookingStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    BookingStatus toStatus;

    @Column(name = "changed_by", nullable = false)
    UUID changedBy;

    @Column(name = "changed_at", nullable = false)
    OffsetDateTime changedAt = OffsetDateTime.now();
}
