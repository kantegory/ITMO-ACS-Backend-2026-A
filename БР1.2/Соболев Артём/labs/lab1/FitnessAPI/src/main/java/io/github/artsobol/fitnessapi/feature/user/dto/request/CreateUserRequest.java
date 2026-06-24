package io.github.artsobol.fitnessapi.feature.user.dto.request;

public record CreateUserRequest(
        String username,
        String email,
        String passwordHash
) {
}
