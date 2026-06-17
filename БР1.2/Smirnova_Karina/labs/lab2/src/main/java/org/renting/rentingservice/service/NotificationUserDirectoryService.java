package org.renting.rentingservice.service;

import org.renting.rentingservice.domain.entity.UserEntity;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("notification")
public class NotificationUserDirectoryService implements UserDirectoryService {

    @Override
    public UserEntity getOrSyncUser(Long userId) {
        throw new UnsupportedOperationException("User directory is not available in notification profile");
    }
}

