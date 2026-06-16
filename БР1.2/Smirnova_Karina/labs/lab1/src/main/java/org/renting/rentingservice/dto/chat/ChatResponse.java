package org.renting.rentingservice.dto.chat;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class ChatResponse {
    Long id;
    Long listingId;
    Long user1Id;
    Long user2Id;
    Instant createdAt;
}
