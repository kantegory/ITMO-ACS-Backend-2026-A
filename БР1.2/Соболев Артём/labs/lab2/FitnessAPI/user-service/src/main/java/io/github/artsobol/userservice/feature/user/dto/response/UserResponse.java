package io.github.artsobol.userservice.feature.user.dto.response;

import io.github.artsobol.userservice.feature.user.entity.Role;

public record UserResponse(
        Long id,
        String username,
        Role role
) {
}
