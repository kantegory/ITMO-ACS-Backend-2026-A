package org.renting.rentingservice.dto.auth;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class RegisterResponse {
    Long id;
    String email;
    String username;
    String phone;
    boolean verified;
    Instant createdAt;
}
