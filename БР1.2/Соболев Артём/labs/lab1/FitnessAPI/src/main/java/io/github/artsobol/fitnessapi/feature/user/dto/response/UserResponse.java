package io.github.artsobol.fitnessapi.feature.user.dto.response;

import io.github.artsobol.fitnessapi.feature.user.entity.Role;

public record UserResponse(
        Long id,
        String username,
        Role role
) {
}
