package ru.itmo.rentease.communication;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class MessageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(name = "sender_id", nullable = false)
    UUID senderId;

    @Column(name = "receiver_id", nullable = false)
    UUID receiverId;

    @Column(name = "property_id", nullable = false)
    UUID propertyId;

    @Column(name = "message_text", nullable = false, length = 4000)
    String messageText;

    @Column(name = "sent_at", nullable = false)
    Instant sentAt = Instant.now();

    @Column(name = "is_read", nullable = false)
    boolean read;
}
