package io.github.artsobol.fitnessapi.feature.auth.auth.service;

import io.github.artsobol.fitnessapi.feature.user.entity.User;

import java.util.UUID;

public interface AccessTokenService {

    String createAccessToken(User user, UUID sessionId);
}
