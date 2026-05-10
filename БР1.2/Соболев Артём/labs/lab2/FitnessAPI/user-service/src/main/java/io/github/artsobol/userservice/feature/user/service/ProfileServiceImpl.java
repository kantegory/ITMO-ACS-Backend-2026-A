package io.github.artsobol.userservice.feature.user.service;

import io.github.artsobol.common.exception.http.BadRequestException;
import io.github.artsobol.common.exception.http.ConflictException;
import io.github.artsobol.common.exception.http.NotFoundException;
import io.github.artsobol.userservice.feature.user.dto.request.CreateProfileRequest;
import io.github.artsobol.userservice.feature.user.dto.request.UpdateProfileRequest;
import io.github.artsobol.userservice.feature.user.dto.response.ProfileResponse;
import io.github.artsobol.userservice.feature.user.entity.Profile;
import io.github.artsobol.userservice.feature.user.entity.User;
import io.github.artsobol.userservice.feature.user.mapper.ProfileMapper;
import io.github.artsobol.userservice.feature.user.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileMapper profileMapper;
    private final UserFinder userFinder;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUserId(Long userId) {
        return profileMapper.toResponse(getProfileByUserId(userFinder.findByIdOrThrow(userId)));
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUsername(String username) {
        log.debug("Fetching profile username={}", username);
        User user = userFinder.findByUsername(username);
        Profile profile = getProfileByUserId(user);
        return profileMapper.toResponse(profile);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public ProfileResponse createProfile(Long userId, CreateProfileRequest request) {
        log.info("Creating profile userId={}", userId);
        ensureProfileNotExists(userId);

        User user = userFinder.findByIdOrThrow(userId);
        Profile entity = Profile.create(user, request.firstName(), request.lastName());
        profileRepository.save(entity);
        log.info("Profile created userId={}", entity.getId());

        return profileMapper.toResponse(entity);
    }

    @Override
    @Transactional
    @PreAuthorize("#userId == authentication.principal.userId")
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        log.info("Updating profile userId={}", userId);
        User user = userFinder.findByIdOrThrow(userId);
        Profile entity = profileRepository.findByUserId(userId)
                .map(profile -> applyProfilePatch(profile, request))
                .orElseGet(() -> createProfileFromPatch(user, request));
        profileRepository.save(entity);

        log.info("Profile updated userId={}", entity.getId());
        return profileMapper.toResponse(entity);
    }

    private Profile applyProfilePatch(Profile profile, UpdateProfileRequest request) {
        profile.applyPatch(request.firstName(), request.lastName());
        return profile;
    }

    private Profile createProfileFromPatch(User user, UpdateProfileRequest request) {
        ensureProfileCreationFieldsPresent(request);
        log.info("Profile not found for userId={}, creating it during update", user.getId());
        return Profile.create(user, request.firstName(), request.lastName());
    }

    private void ensureProfileCreationFieldsPresent(UpdateProfileRequest request) {
        if (!StringUtils.hasText(request.firstName()) || !StringUtils.hasText(request.lastName())) {
            throw new BadRequestException("profile.create.missing-fields");
        }
    }

    private Profile getProfileByUserId(User user) {
        log.debug("Fetching profile userId={}", user.getId());
        return profileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("profile.id.not.found", user.getId()));
    }

    private void ensureProfileNotExists(Long userId) {
        log.debug("Checking profile uniqueness userId={}", userId);
        if (profileRepository.existsByUserId(userId)) {
            throw new ConflictException("profile.id.exists", userId);
        }
    }
}
