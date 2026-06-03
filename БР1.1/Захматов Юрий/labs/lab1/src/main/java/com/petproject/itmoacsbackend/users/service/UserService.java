package com.petproject.itmoacsbackend.users.service;

import com.petproject.itmoacsbackend.users.dto.UserResponse;
import com.petproject.itmoacsbackend.users.dto.UserUpdateRequest;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import com.petproject.itmoacsbackend.users.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getCurrentUser(UserEntity user){
        return mapToResponse(user);
    }

    public UserResponse updateUser(UserUpdateRequest request, UserEntity user){

        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName());
        }
        if (request.patronymic() != null) {
            user.setPatronymic(request.patronymic());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber());
        }
        if (request.email() != null && !request.email().isBlank()) {
            if (!user.getEmail().equals(request.email()) &&
                    userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(request.email());
        }

        return mapToResponse(userRepository.save(user));

    }


    private UserResponse mapToResponse(UserEntity user){
        return UserResponse.builder()
                .id(user.getId())
                .role(user.getGlobalRole())
                .username(user.getUsername())
                .isLandlord(user.getIsLandlord())
                .isRenter(user.getIsRenter())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .patronymic(user.getPatronymic())
                .phoneNumber(user.getPhoneNumber())
                .build();

    }

}
