package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.repository.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("user")
@RequiredArgsConstructor
public class LocalUserDirectoryService implements UserDirectoryService {

    private final UserRepository userRepository;

    @Override
    public UserEntity getOrSyncUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}

