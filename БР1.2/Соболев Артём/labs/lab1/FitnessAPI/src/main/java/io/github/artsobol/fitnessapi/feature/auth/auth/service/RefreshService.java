package io.github.artsobol.fitnessapi.feature.auth.auth.service;

import io.github.artsobol.fitnessapi.feature.auth.auth.dto.response.AuthResponse;
import io.github.artsobol.fitnessapi.feature.auth.refreshtoken.dto.request.RotateRefreshTokenRequest;

public interface RefreshService {

    AuthResponse refresh(RotateRefreshTokenRequest request);

    void logout(String rawRefreshToken);
}
