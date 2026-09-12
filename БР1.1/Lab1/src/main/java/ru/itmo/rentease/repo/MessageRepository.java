package ru.itmo.rentease.repo;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.itmo.rentease.Domain.Message;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    @Query("SELECT m FROM Message m WHERE m.sender.id = :userId OR m.receiver.id = :userId ORDER BY m.sentAt DESC")
    List<Message> findInbox(UUID userId);

    @Query("""
        SELECT m FROM Message m
        WHERE m.property.id = :propertyId
          AND ((m.sender.id = :currentUserId AND m.receiver.id = :otherUserId)
            OR (m.sender.id = :otherUserId AND m.receiver.id = :currentUserId))
        ORDER BY m.sentAt DESC
        """)
    List<Message> findDialog(UUID currentUserId, UUID otherUserId, UUID propertyId, Pageable pageable);
}
