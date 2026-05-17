package org.renting.rentingservice.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateChatRequest {
    @NotNull
    private Long otherUserId;
}
