package com.petproject.bookingservice.repositories;

import com.petproject.bookingservice.entities.BookingEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    Page<BookingEntity> findByPropertyId(Long propertyId, Pageable pageable);

    Page<BookingEntity> findAllByRenterId(Long userId, Pageable pageable);
}
