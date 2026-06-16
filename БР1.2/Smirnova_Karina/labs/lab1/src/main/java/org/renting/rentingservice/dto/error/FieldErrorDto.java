package org.renting.rentingservice.dto.error;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class FieldErrorDto {
    String field;
    String message;
}
