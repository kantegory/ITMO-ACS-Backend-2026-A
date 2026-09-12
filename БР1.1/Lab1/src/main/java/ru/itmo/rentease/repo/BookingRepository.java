package ru.itmo.rentease.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.itmo.rentease.Domain.*;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByTenantId(UUID tenantId);
    List<Booking> findByTenantIdAndStatus(UUID tenantId, BookingStatus status);
    @Query("SELECT b FROM Booking b WHERE b.property.landlord.id = :landlordId")
    List<Booking> findByLandlordId(UUID landlordId);
    @Query("SELECT b FROM Booking b WHERE b.property.landlord.id = :landlordId AND b.status = :status")
    List<Booking> findByLandlordIdAndStatus(UUID landlordId, BookingStatus status);

    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.property.id = :propertyId
          AND b.status IN :statuses
          AND b.startDate <= :endDate
          AND b.endDate >= :startDate
        """)
    boolean existsOverlappingBooking(UUID propertyId, java.time.LocalDate startDate, java.time.LocalDate endDate,
                                     List<BookingStatus> statuses);
}
