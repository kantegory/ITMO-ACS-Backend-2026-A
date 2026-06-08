package org.rentservice.data.response;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MessageResponse {

    private Long id;

    private UserShortDto sender;

    private UserShortDto recipient;

    private Long contractId;

    private String text;

    private LocalDateTime createdAt;
}
