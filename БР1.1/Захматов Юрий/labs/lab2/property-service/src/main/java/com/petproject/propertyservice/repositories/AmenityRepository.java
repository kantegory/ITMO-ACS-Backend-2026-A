package com.petproject.propertyservice.repositories;

import com.petproject.propertyservice.entities.AmenityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmenityRepository extends JpaRepository<AmenityEntity, Long> {

    List<AmenityEntity> name(String name);

    Optional<AmenityEntity> findByName(String name);
}
