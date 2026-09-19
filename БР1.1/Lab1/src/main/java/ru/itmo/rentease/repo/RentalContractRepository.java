package ru.itmo.rentease.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.itmo.rentease.Domain.RentalContract;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RentalContractRepository extends JpaRepository<RentalContract, UUID> {
    Optional<RentalContract> findByBookingId(UUID bookingId);

    @Query("SELECT c FROM RentalContract c WHERE c.booking.tenant.id = :userId OR c.booking.property.landlord.id = :userId")
    List<RentalContract> findVisibleToUser(UUID userId);
}
