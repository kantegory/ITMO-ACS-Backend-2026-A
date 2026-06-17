package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.ListingEntity;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("property")
@RequiredArgsConstructor
public class LocalListingDirectoryService implements ListingDirectoryService {

    private final ListingService listingService;

    @Override
    public ListingEntity getOrSyncListing(Long listingId) {
        return listingService.findListing(listingId);
    }
}

