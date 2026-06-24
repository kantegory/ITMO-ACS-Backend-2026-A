package io.github.artsobol.fitnessapi.feature.user.service;

import io.github.artsobol.fitnessapi.feature.user.dto.request.CreateProfileRequest;
import io.github.artsobol.fitnessapi.feature.user.dto.request.UpdateProfileRequest;
import io.github.artsobol.fitnessapi.feature.user.dto.response.ProfileResponse;
import io.github.artsobol.fitnessapi.feature.user.dto.response.UserProgressResponse;

public interface ProfileService {

    ProfileResponse getProfileByUserId(Long userId);

    ProfileResponse getProfileByUsername(String username);

    UserProgressResponse getProgress(Long userId);

    ProfileResponse createProfile(Long userId, CreateProfileRequest request);

    ProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
}
