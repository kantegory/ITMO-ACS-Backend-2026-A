package org.renting.rentingservice.dto.error;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class ErrorResponse {
    String code;
    String message;
    Map<String, Object> details;
}
