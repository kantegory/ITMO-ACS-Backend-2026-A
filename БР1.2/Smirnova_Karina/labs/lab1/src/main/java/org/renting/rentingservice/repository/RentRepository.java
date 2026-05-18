package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.RentEntity;
import org.renting.rentingservice.domain.enums.RentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RentRepository extends JpaRepository<RentEntity, Long> {

    Page<RentEntity> findByGuestIdAndStatus(Long guestId, RentStatus status, Pageable pageable);

    Page<RentEntity> findByGuestId(Long guestId, Pageable pageable);

    List<RentEntity> findByGuestId(Long guestId);

    List<RentEntity> findByListing_Owner_Id(Long ownerId);

    Optional<RentEntity> findFirstByListingIdAndGuestIdOrderByCreatedAtDesc(Long listingId, Long guestId);
}
