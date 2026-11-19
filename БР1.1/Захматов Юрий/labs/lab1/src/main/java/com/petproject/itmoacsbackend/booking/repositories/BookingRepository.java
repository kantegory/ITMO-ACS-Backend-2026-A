package com.petproject.itmoacsbackend.booking.repositories;

import com.petproject.itmoacsbackend.booking.entities.BookingEntity;
import com.petproject.itmoacsbackend.property.entities.PropertyEntity;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    Page<BookingEntity> findByPropertyId(PropertyEntity propertyId, Pageable pageable);

    Page<BookingEntity> findAllByRenterId(UserEntity user, Pageable pageable);
}
