package ru.itmo.rentease.communication;

import jakarta.validation.Valid;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MessageController {
    private final MessageRepository messages;
    private final InternalHttpClient internal;
    private final NotificationRepository notifications;
    private final String identityServiceUrl;
    private final String propertyServiceUrl;

    public MessageController(MessageRepository messages,
                              InternalHttpClient internal,
                              NotificationRepository notifications,
                              @Value("${identity-service.url:http://localhost:8081}") String identityServiceUrl,
                              @Value("${property-service.url:http://localhost:8082}") String propertyServiceUrl) {
        this.messages = messages;
        this.internal = internal;
        this.notifications = notifications;
        this.identityServiceUrl = identityServiceUrl;
        this.propertyServiceUrl = propertyServiceUrl;
    }

    @GetMapping("/health")
    ApiDtos.HealthResponse health() {
        return new ApiDtos.HealthResponse("healthy", "communication-service");
    }

    @GetMapping("/messages")
    List<ApiDtos.MessageResponse> list() {
        UUID userId = SecurityConfig.currentUserId();
        return messages.findBySenderIdOrReceiverIdOrderBySentAtDesc(userId, userId)
                .stream().map(this::response).toList();
    }

    @GetMapping("/notifications")
    List<ApiDtos.NotificationResponse> notifications() {
        UUID recipientId = SecurityConfig.currentUserId();
        return notifications.findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .map(this::notificationResponse).toList();
    }

    @RabbitListener(queues = ru.itmo.rentease.common.MessagingConstants.BOOKING_CONFIRMED_QUEUE)
    public void onBookingConfirmed(ApiDtos.BookingConfirmedEvent event) {
        saveNotification(event.tenantId(), event,
                "Booking " + event.bookingId() + " was confirmed");
        saveNotification(event.landlordId(), event,
                "Booking " + event.bookingId() + " was confirmed");
    }

    private void saveNotification(UUID recipientId, ApiDtos.BookingConfirmedEvent event, String message) {
        if (notifications.existsByBookingIdAndRecipientId(event.bookingId(), recipientId)) return;
        NotificationEntity notification = new NotificationEntity();
        notification.recipientId = recipientId;
        notification.bookingId = event.bookingId();
        notification.type = "BOOKING_CONFIRMED";
        notification.message = message;
        notifications.save(notification);
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    ApiDtos.MessageResponse create(@Valid @RequestBody ApiDtos.MessageRequest request) {
        UUID senderId = SecurityConfig.currentUserId();
        if (senderId.equals(request.receiverId())) throw AppException.badRequest("Sender and receiver must differ");
        ApiDtos.UserStatusResponse receiver = internal.get(identityServiceUrl,
                "/internal/users/" + request.receiverId() + "/status", ApiDtos.UserStatusResponse.class);
        if (!receiver.active()) throw AppException.notFound("Receiver not found or inactive");
        internal.get(propertyServiceUrl, "/internal/properties/" + request.propertyId() + "/summary",
                ApiDtos.PropertySummary.class);
        MessageEntity message = new MessageEntity();
        message.senderId = senderId;
        message.receiverId = request.receiverId();
        message.propertyId = request.propertyId();
        message.messageText = request.messageText();
        return response(messages.save(message));
    }

    @GetMapping({"/dialogs/{userId}/{propertyId}", "/messages/dialogs/{userId}/{propertyId}"})
    List<ApiDtos.MessageResponse> dialog(@PathVariable UUID userId, @PathVariable UUID propertyId) {
        UUID currentUser = SecurityConfig.currentUserId();
        if (currentUser.equals(userId)) throw AppException.badRequest("Dialog participant must differ from current user");
        return messages.findDialog(currentUser, userId, propertyId).stream().map(this::response).toList();
    }

    private ApiDtos.MessageResponse response(MessageEntity message) {
        return new ApiDtos.MessageResponse(message.id, message.senderId, message.receiverId, message.propertyId,
                message.messageText, message.sentAt, message.read);
    }

    private ApiDtos.NotificationResponse notificationResponse(NotificationEntity notification) {
        return new ApiDtos.NotificationResponse(notification.id, notification.recipientId,
                notification.bookingId, notification.type, notification.message, notification.createdAt);
    }
}
