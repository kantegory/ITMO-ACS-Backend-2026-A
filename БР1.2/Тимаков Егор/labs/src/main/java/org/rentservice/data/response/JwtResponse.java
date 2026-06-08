package org.rentservice.data.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class JwtResponse {

    private String accessToken;

    private String refreshToken;
}
