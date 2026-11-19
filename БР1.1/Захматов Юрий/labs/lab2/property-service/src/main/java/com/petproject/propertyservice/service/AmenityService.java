package com.petproject.propertyservice.service;

import com.petproject.propertyservice.entities.AmenityEntity;
import com.petproject.propertyservice.repositories.AmenityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmenityService {

    private final AmenityRepository amenityRepository;

    @Transactional
    public Set<AmenityEntity> findOrCreateAmenities(List<String> amenityNames) {
        if (amenityNames == null || amenityNames.isEmpty()) {
            return new HashSet<>();
        }

        Set<AmenityEntity> amenities = new HashSet<>();

        for (String amenityName : amenityNames) {
            AmenityEntity amenity = amenityRepository.findByName(amenityName)
                    .orElseGet(() -> amenityRepository.save(
                            AmenityEntity.builder()
                                     .name(amenityName)
                                     .build()
                    ));
            amenities.add(amenity);
        }
        return amenities;
    }
}
