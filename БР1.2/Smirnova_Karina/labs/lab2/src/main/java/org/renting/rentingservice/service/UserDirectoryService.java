package org.renting.rentingservice.service;

import org.renting.rentingservice.domain.entity.UserEntity;

public interface UserDirectoryService {

    UserEntity getOrSyncUser(Long userId);
}

