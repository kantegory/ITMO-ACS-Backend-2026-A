package org.renting.rentingservice.repository;

import org.renting.rentingservice.domain.entity.ListingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ListingRepository extends JpaRepository<ListingEntity, Long>, JpaSpecificationExecutor<ListingEntity> {

    List<ListingEntity> findByOwnerId(Long ownerId);

    @Modifying
    @Query(value = """
            INSERT INTO listings (id, owner_id, rent_mode, title, description, address, location, house_type, is_active, created_at)
            VALUES (
                :id,
                :ownerId,
                :rentMode,
                :title,
                :description,
                :address,
                CASE
                    WHEN :lat IS NULL OR :lng IS NULL THEN NULL
                    ELSE ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
                END,
                :houseType,
                :active,
                :createdAt
            )
            ON CONFLICT (id) DO UPDATE SET
                owner_id = EXCLUDED.owner_id,
                rent_mode = EXCLUDED.rent_mode,
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                address = EXCLUDED.address,
                location = EXCLUDED.location,
                house_type = EXCLUDED.house_type,
                is_active = EXCLUDED.is_active,
                created_at = EXCLUDED.created_at
            """, nativeQuery = true)
    void upsertShadowListing(
            @Param("id") Long id,
            @Param("ownerId") Long ownerId,
            @Param("rentMode") String rentMode,
            @Param("title") String title,
            @Param("description") String description,
            @Param("address") String address,
            @Param("lat") Double lat,
            @Param("lng") Double lng,
            @Param("houseType") String houseType,
            @Param("active") boolean active,
            @Param("createdAt") Instant createdAt
    );
}
