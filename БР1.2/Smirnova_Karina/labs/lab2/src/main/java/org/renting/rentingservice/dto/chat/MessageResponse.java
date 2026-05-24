package org.renting.rentingservice.dto.chat;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class MessageResponse {
    Long id;
    Long chatId;
    Long senderId;
    String content;
    Instant createdAt;
}
