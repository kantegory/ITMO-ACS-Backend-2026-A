package com.petproject.propertyservice.repositories;

import com.petproject.propertyservice.entities.PropertyImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImageEntity, Long> {
}
