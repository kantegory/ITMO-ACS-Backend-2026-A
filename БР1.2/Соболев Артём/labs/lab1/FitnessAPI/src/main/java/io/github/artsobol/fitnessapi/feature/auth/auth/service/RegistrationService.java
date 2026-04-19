package io.github.artsobol.fitnessapi.feature.auth.auth.service;

import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.RegistrationRequest;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.SessionMetadata;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.response.AuthResponse;

public interface RegistrationService {

    AuthResponse register(RegistrationRequest request, SessionMetadata meta);
}
