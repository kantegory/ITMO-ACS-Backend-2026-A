package ru.itmo.rentease.contract;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<RentalContractEntity, UUID> {
    Optional<RentalContractEntity> findByBookingId(UUID bookingId);
    List<RentalContractEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<RentalContractEntity> findByLandlordIdOrderByCreatedAtDesc(UUID landlordId);
}
