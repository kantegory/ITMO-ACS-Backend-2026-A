package org.renting.rentingservice.service;

import org.renting.rentingservice.domain.entity.ListingEntity;

public interface ListingDirectoryService {

    ListingEntity getOrSyncListing(Long listingId);
}

