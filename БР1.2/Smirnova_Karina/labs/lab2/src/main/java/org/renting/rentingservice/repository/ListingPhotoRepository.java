package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.ListingPhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListingPhotoRepository extends JpaRepository<ListingPhotoEntity, Long> {

    List<ListingPhotoEntity> findByListingIdOrderByUploadedAtAsc(Long listingId);

    Optional<ListingPhotoEntity> findByIdAndListingId(Long id, Long listingId);

    long countByListingId(Long listingId);
}
