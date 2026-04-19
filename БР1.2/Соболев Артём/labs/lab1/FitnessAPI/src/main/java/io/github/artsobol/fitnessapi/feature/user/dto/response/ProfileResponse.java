package io.github.artsobol.fitnessapi.feature.user.dto.response;

public record ProfileResponse(
        Long id,
        String firstName,
        String lastName,
        UserResponse user
) {
}
