package io.github.artsobol.fitnessapi.feature.auth.auth.dto.response;

import io.github.artsobol.fitnessapi.feature.user.entity.Role;

public record UserInfo(
        Long userId,
        String username,
        Role role
) {
}
