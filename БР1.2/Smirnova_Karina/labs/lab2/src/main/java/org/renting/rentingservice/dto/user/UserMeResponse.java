package org.renting.rentingservice.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMeResponse {
    Long id;
    String email;
    String username;
    String phone;
    boolean verified;
    Instant createdAt;
}
