package io.github.artsobol.userservice.feature.auth.auth.service;

import io.github.artsobol.userservice.feature.auth.auth.dto.response.AuthResponse;
import io.github.artsobol.userservice.feature.auth.refreshtoken.dto.request.RotateRefreshTokenRequest;

public interface RefreshService {

    AuthResponse refresh(RotateRefreshTokenRequest request);

    void logout(String rawRefreshToken);
}
