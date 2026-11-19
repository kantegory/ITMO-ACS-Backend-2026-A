package com.petproject.itmoacsbackend.property.repositories;

import com.petproject.itmoacsbackend.property.entities.PropertyEntity;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
@Repository
public interface PropertyRepository extends JpaRepository<PropertyEntity, Long> {

    Page<PropertyEntity> findAllByAvailableTrue(Pageable pageable);
    Page<PropertyEntity> findAllByUserId(UserEntity user, Pageable pageable);

    @Query("SELECT p FROM PropertyEntity p WHERE " +
            "(:available IS NULL OR p.available = :available) AND " +
            "(:type IS NULL OR p.type = :type) AND " +
            "(:country IS NULL OR LOWER(p.country) LIKE LOWER(CONCAT('%', :country, '%'))) AND " +
            "(:region IS NULL OR LOWER(p.region) LIKE LOWER(CONCAT('%', :region, '%'))) AND " +
            "(:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
            "(:nearestSubway IS NULL OR LOWER(p.nearestSubway) LIKE LOWER(CONCAT('%', :nearestSubway, '%'))) AND " +
            "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
            "(:minSquare IS NULL OR p.square >= :minSquare) AND " +
            "(:maxSquare IS NULL OR p.square <= :maxSquare)")
    Page<PropertyEntity> findByFilters(
            @Param("available") Boolean available,
            @Param("type") String type,
            @Param("country") String country,
            @Param("region") String region,
            @Param("city") String city,
            @Param("nearestSubway") String nearestSubway,
            @Param("minPrice") Float minPrice,
            @Param("maxPrice") Float maxPrice,
            @Param("minSquare") Float minSquare,
            @Param("maxSquare") Float maxSquare,
            Pageable pageable
    );

    @Query("SELECT p FROM PropertyEntity p WHERE " +
            "LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<PropertyEntity> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);




}
