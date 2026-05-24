package org.renting.rentingservice.service;

import org.renting.rentingservice.domain.entity.ListingEntity;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile({"user", "notification"})
public class NotificationListingDirectoryService implements ListingDirectoryService {

    @Override
    public ListingEntity getOrSyncListing(Long listingId) {
        throw new UnsupportedOperationException("Listing directory is not available for this profile");
    }
}

