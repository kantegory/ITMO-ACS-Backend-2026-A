package ru.itmo.rentease.communication;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications", uniqueConstraints = @UniqueConstraint(
        name = "uq_notification_booking_recipient", columnNames = {"booking_id", "recipient_id"}))
public class NotificationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "recipient_id", nullable = false)
    UUID recipientId;

    @Column(name = "booking_id", nullable = false)
    UUID bookingId;

    @Column(nullable = false, length = 80)
    String type;

    @Column(nullable = false, length = 4000)
    String message;

    @Column(name = "created_at", nullable = false)
    Instant createdAt = Instant.now();
}
