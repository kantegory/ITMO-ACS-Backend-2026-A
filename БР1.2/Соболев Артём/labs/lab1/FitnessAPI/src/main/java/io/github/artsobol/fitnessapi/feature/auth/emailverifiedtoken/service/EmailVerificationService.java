package io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.service;

import io.github.artsobol.fitnessapi.feature.user.entity.User;

public interface EmailVerificationService {

    String createVerificationToken(User user);

    void validateToken(String rawToken);

    void verifyEmail(String rawToken);
}
