package org.renting.rentingservice.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LogoutRequest {
    @NotBlank
    private String refreshToken;
}
