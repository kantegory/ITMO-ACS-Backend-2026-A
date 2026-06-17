package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.BookingEntity;
import org.renting.rentingservice.domain.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<BookingEntity, Long> {

    Page<BookingEntity> findByGuestIdAndStatus(Long guestId, BookingStatus status, Pageable pageable);

    Page<BookingEntity> findByGuestId(Long guestId, Pageable pageable);

    List<BookingEntity> findByGuestId(Long guestId);

    List<BookingEntity> findByListing_Owner_Id(Long ownerId);

    @Query("""
            SELECT COUNT(b) > 0 FROM BookingEntity b
            WHERE b.listing.id = :listingId
              AND b.status IN :activeStatuses
              AND b.startDate < :endDate
              AND b.endDate > :startDate
            """)
    boolean existsOverlappingBooking(
            @Param("listingId") Long listingId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("activeStatuses") Collection<BookingStatus> activeStatuses);

    boolean existsByListingIdAndStatusIn(Long listingId, Collection<BookingStatus> statuses);
}
