package io.github.artsobol.userservice.feature.auth.auth.dto.response;

import io.github.artsobol.userservice.feature.user.entity.Role;

public record UserInfo(
        Long userId,
        String username,
        Role role
) {
}
