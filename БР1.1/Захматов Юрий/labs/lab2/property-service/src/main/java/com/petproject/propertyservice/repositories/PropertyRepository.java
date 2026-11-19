package com.petproject.propertyservice.repositories;

import com.petproject.propertyservice.entities.PropertyEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PropertyRepository extends JpaRepository<PropertyEntity, Long> {

    Page<PropertyEntity> findAllByAvailableTrue(Pageable pageable);
    Page<PropertyEntity> findAllByUserId(Long userId, Pageable pageable);

    @Query("SELECT p FROM PropertyEntity p WHERE " +
            "(:available IS NULL OR p.available = :available) AND " +
            "(:type IS NULL OR p.type = :type) AND " +
            "p.country LIKE CONCAT('%', :country, '%') AND " +
            "p.region LIKE CONCAT('%', :region, '%') AND " +
            "p.city LIKE CONCAT('%', :city, '%') AND " +
            "p.nearestSubway LIKE CONCAT('%', :nearestSubway, '%') AND " +
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

    @Query(value = "SELECT * FROM PropertyEntity p WHERE " +
            "p.title ILIKE CONCAT('%', CAST(:keyword AS text), '%') OR " +
            "p.description ILIKE CONCAT('%', CAST(:keyword AS text), '%')",
            nativeQuery = true)
    Page<PropertyEntity> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);


    @Query("SELECT p.userId FROM PropertyEntity p WHERE p.id = :id")
    Optional<Long> findUserIdById(@Param("id") Long id);

}
