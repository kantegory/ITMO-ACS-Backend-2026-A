package io.github.artsobol.userservice.feature.user.dto.response;

public record ProfileResponse(
        Long id,
        String firstName,
        String lastName,
        UserResponse user
) {
}
