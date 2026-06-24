package io.github.artsobol.fitnessapi.feature.user.service;

import io.github.artsobol.fitnessapi.feature.user.entity.User;

public interface UserFinder {

    User findByUsername(String username);

    User findByIdOrThrow(Long id);

    User findByEmailOrThrow(String email);
}
