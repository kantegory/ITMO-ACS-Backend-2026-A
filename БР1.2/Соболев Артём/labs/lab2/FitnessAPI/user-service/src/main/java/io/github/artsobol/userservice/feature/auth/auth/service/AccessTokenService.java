package io.github.artsobol.userservice.feature.auth.auth.service;

import io.github.artsobol.userservice.feature.user.entity.User;

import java.util.UUID;

public interface AccessTokenService {

    String createAccessToken(User user, UUID sessionId);
}
