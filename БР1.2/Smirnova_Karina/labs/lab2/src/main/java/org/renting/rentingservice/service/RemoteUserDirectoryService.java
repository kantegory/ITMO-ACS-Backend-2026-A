package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.dto.user.UserMeResponse;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@Profile("!user & !notification")
@RequiredArgsConstructor
public class RemoteUserDirectoryService implements UserDirectoryService {

    private static final String EXTERNAL_PASSWORD_PLACEHOLDER = "{external}";

    private final RestClient userServiceRestClient;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserEntity getOrSyncUser(Long userId) {
        UserMeResponse remoteUser = fetchRemoteUser(userId);
        upsertLocalUser(remoteUser);
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private UserMeResponse fetchRemoteUser(Long userId) {
        try {
            return userServiceRestClient.get()
                    .uri("/internal/users/{userId}", userId)
                    .retrieve()
                    .body(UserMeResponse.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new NotFoundException("User not found");
            }
            throw e;
        }
    }

    private void upsertLocalUser(UserMeResponse remoteUser) {
        userRepository.upsertShadowUser(
                remoteUser.getId(),
                remoteUser.getUsername(),
                remoteUser.getEmail(),
                EXTERNAL_PASSWORD_PLACEHOLDER,
                remoteUser.getPhone(),
                remoteUser.isVerified(),
                remoteUser.getCreatedAt()
        );
    }
}
