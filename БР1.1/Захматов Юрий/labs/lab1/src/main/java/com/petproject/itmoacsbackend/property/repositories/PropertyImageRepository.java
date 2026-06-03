package com.petproject.itmoacsbackend.property.repositories;

import com.petproject.itmoacsbackend.property.entities.PropertyImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImageEntity, Long> {
}
