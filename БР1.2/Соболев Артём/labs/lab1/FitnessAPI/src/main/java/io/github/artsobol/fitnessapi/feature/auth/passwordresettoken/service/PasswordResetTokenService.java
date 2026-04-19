package io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.service;

import io.github.artsobol.fitnessapi.feature.user.entity.User;

public interface PasswordResetTokenService {

    String createResetToken(User user);

    void validateToken(String rawToken);

    void resetPassword(String rawToken, String newPassword);
}
