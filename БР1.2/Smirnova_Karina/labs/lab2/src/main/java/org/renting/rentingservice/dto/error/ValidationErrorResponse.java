package org.renting.rentingservice.dto.error;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ValidationErrorResponse {
    String code;
    String message;
    List<FieldErrorDto> fieldErrors;
}
