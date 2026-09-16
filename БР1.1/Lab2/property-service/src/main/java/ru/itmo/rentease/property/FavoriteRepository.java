package ru.itmo.rentease.property;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<FavoriteEntity, UUID> {
    List<FavoriteEntity> findByUserId(UUID userId);
    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);
}
