package io.github.artsobol.fitnessapi.feature.user.service;

import io.github.artsobol.fitnessapi.feature.user.dto.request.CreateUserRequest;
import io.github.artsobol.fitnessapi.feature.user.entity.User;

public interface UserService {

    User createUser(CreateUserRequest request);

    User findByUsername(String username);
}
