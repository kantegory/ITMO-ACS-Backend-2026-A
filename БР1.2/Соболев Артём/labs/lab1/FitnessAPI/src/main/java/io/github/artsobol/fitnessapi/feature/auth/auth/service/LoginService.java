package io.github.artsobol.fitnessapi.feature.auth.auth.service;

import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.LoginRequest;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.SessionMetadata;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.response.AuthResponse;

public interface LoginService {

    AuthResponse login(LoginRequest request, SessionMetadata meta);
}
