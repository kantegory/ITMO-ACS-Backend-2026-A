package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.ListingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ListingRepository extends JpaRepository<ListingEntity, Long>, JpaSpecificationExecutor<ListingEntity> {

    List<ListingEntity> findByOwnerId(Long ownerId);
}
