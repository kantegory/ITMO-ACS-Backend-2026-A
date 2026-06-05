package io.github.artsobol.userservice.feature.user.dto.request;

public record CreateUserRequest(
        String username,
        String email,
        String passwordHash
) {
}
