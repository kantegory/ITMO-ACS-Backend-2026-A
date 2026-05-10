package io.github.artsobol.userservice.feature.user.service;

import io.github.artsobol.userservice.feature.user.dto.request.CreateProfileRequest;
import io.github.artsobol.userservice.feature.user.dto.request.UpdateProfileRequest;
import io.github.artsobol.userservice.feature.user.dto.response.ProfileResponse;

public interface ProfileService {

    ProfileResponse getProfileByUserId(Long userId);

    ProfileResponse getProfileByUsername(String username);

    ProfileResponse createProfile(Long userId, CreateProfileRequest request);

    ProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
}
