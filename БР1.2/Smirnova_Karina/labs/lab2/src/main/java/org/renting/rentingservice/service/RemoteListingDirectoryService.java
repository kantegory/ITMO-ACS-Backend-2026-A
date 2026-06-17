package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.ListingEntity;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.dto.listing.InternalListingResponse;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.repository.ListingRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@Profile("communication")
@RequiredArgsConstructor
public class RemoteListingDirectoryService implements ListingDirectoryService {

    private final RestClient propertyServiceRestClient;
    private final ListingRepository listingRepository;
    private final UserDirectoryService userDirectoryService;

    @Override
    @Transactional
    public ListingEntity getOrSyncListing(Long listingId) {
        InternalListingResponse remoteListing = fetchRemoteListing(listingId);
        UserEntity owner = remoteListing.getOwnerId() != null
                ? userDirectoryService.getOrSyncUser(remoteListing.getOwnerId())
                : null;

        listingRepository.upsertShadowListing(
                remoteListing.getId(),
                owner != null ? owner.getId() : null,
                remoteListing.getRentMode().name(),
                remoteListing.getTitle(),
                remoteListing.getDescription(),
                remoteListing.getAddress(),
                remoteListing.getLat(),
                remoteListing.getLng(),
                remoteListing.getHouseType().name(),
                remoteListing.isActive(),
                remoteListing.getCreatedAt()
        );

        return listingRepository.findById(listingId)
                .orElseThrow(() -> new NotFoundException("Listing not found"));
    }

    private InternalListingResponse fetchRemoteListing(Long listingId) {
        try {
            return propertyServiceRestClient.get()
                    .uri("/listings/internal/listings/{listingId}", listingId)
                    .retrieve()
                    .body(InternalListingResponse.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new NotFoundException("Listing not found");
            }
            throw e;
        }
    }
}

