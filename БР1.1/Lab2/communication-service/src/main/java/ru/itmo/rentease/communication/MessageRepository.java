package ru.itmo.rentease.communication;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {
    List<MessageEntity> findBySenderIdOrReceiverIdOrderBySentAtDesc(UUID senderId, UUID receiverId);

    @Query("select m from MessageEntity m where m.propertyId = :propertyId " +
            "and ((m.senderId = :currentUser and m.receiverId = :otherUser) " +
            "or (m.senderId = :otherUser and m.receiverId = :currentUser)) " +
            "order by m.sentAt asc")
    List<MessageEntity> findDialog(@Param("currentUser") UUID currentUser,
                                   @Param("otherUser") UUID otherUser,
                                   @Param("propertyId") UUID propertyId);
}
