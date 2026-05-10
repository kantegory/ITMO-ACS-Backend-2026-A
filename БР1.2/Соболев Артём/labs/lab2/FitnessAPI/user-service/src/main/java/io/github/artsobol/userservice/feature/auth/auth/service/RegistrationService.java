package io.github.artsobol.userservice.feature.auth.auth.service;

import io.github.artsobol.userservice.feature.auth.auth.dto.request.RegistrationRequest;
import io.github.artsobol.userservice.feature.auth.auth.dto.request.SessionMetadata;
import io.github.artsobol.userservice.feature.auth.auth.dto.response.AuthResponse;

public interface RegistrationService {

    AuthResponse register(RegistrationRequest request, SessionMetadata meta);
}
