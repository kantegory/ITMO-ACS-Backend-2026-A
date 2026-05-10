package io.github.artsobol.userservice.feature.user.service;

import io.github.artsobol.userservice.feature.user.entity.User;

public interface UserFinder {

    User findByUsername(String username);

    User findByIdOrThrow(Long id);

    User findByEmailOrThrow(String email);
}
