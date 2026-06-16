package org.renting.rentingservice.dto.auth;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TokensResponse {
    String accessToken;
    String refreshToken;
    String tokenType;
    String accessExpiresIn;
    String refreshExpiresIn;
}
