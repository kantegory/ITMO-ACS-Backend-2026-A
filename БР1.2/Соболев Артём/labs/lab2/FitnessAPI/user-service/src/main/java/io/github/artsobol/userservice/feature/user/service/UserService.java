package io.github.artsobol.userservice.feature.user.service;

import io.github.artsobol.userservice.feature.user.dto.request.CreateUserRequest;
import io.github.artsobol.userservice.feature.user.entity.User;

public interface UserService {

    User createUser(CreateUserRequest request);

    User findByUsername(String username);
}
