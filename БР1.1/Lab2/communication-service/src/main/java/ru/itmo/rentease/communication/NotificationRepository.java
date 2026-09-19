package ru.itmo.rentease.communication;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {
    List<NotificationEntity> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    boolean existsByBookingIdAndRecipientId(UUID bookingId, UUID recipientId);
}
