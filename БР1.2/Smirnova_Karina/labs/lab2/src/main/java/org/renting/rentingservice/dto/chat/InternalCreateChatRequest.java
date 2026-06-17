package org.renting.rentingservice.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InternalCreateChatRequest {
    @NotNull
    private Long user1Id;
    @NotNull
    private Long user2Id;
    @NotNull
    private Long listingId;
}
