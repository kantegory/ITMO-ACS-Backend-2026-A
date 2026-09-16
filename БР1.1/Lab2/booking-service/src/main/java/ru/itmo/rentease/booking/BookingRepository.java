package ru.itmo.rentease.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.itmo.rentease.common.BookingStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<BookingEntity, UUID> {
    List<BookingEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<BookingEntity> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, BookingStatus status);
    List<BookingEntity> findByLandlordIdOrderByCreatedAtDesc(UUID landlordId);
    List<BookingEntity> findByLandlordIdAndStatusOrderByCreatedAtDesc(UUID landlordId, BookingStatus status);

    @Query("select count(b) > 0 from BookingEntity b " +
            "where b.propertyId = :propertyId and b.status in :statuses " +
            "and b.startDate <= :endDate and b.endDate >= :startDate")
    boolean existsOverlapping(@Param("propertyId") UUID propertyId,
                              @Param("startDate") LocalDate startDate,
                              @Param("endDate") LocalDate endDate,
                              @Param("statuses") List<BookingStatus> statuses);
}
