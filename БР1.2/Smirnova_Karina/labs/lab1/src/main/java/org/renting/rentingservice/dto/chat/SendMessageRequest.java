package org.renting.rentingservice.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotBlank
    private String content;
}
