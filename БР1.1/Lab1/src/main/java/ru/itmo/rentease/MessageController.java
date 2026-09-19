package ru.itmo.rentease;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.Domain.*;
import ru.itmo.rentease.repo.AccountRepository;
import ru.itmo.rentease.repo.MessageRepository;
import ru.itmo.rentease.repo.PropertyRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static ru.itmo.rentease.ApiDtos.*;

@RestController
@RequestMapping("/api/v1/messages")
@SecurityRequirement(name = "bearerAuth")
public class MessageController {
    private final MessageRepository messages;
    private final AccountRepository accounts;
    private final PropertyRepository properties;

    public MessageController(MessageRepository messages, AccountRepository accounts, PropertyRepository properties) {
        this.messages = messages;
        this.accounts = accounts;
        this.properties = properties;
    }

    @GetMapping
    List<MessageResponse> list() {
        return messages.findInbox(SecurityConfig.currentUserId()).stream().map(MessageResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MessageResponse send(@Valid @RequestBody MessageRequest request) {
        Account sender = accounts.findById(SecurityConfig.currentUserId()).orElseThrow(() -> AppException.notFound("User not found"));
        Account receiver = accounts.findById(request.receiverId()).orElseThrow(() -> AppException.notFound("Receiver not found"));
        Property property = properties.findById(request.propertyId()).orElseThrow(() -> AppException.notFound("Property not found"));
        Message message = new Message();
        message.sender = sender;
        message.receiver = receiver;
        message.property = property;
        message.messageText = request.messageText();
        message.sentAt = Instant.now();
        message.isRead = false;
        return MessageResponse.from(messages.save(message));
    }

    @GetMapping("/dialogs/{userId}/{propertyId}")
    List<MessageResponse> dialog(@PathVariable UUID userId, @PathVariable UUID propertyId,
                                 @RequestParam(defaultValue = "50") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return messages.findDialog(SecurityConfig.currentUserId(), userId, propertyId, PageRequest.of(0, safeLimit))
                .stream().map(MessageResponse::from).toList();
    }
}
