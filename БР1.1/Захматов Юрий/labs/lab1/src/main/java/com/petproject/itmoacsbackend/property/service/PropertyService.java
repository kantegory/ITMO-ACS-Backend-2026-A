package com.petproject.itmoacsbackend.property.service;

import com.petproject.itmoacsbackend.auth.enums.GlobalRole;
import com.petproject.itmoacsbackend.property.dto.*;
import com.petproject.itmoacsbackend.property.entities.AmenityEntity;
import com.petproject.itmoacsbackend.property.entities.PropertyEntity;
import com.petproject.itmoacsbackend.property.entities.PropertyImageEntity;
import com.petproject.itmoacsbackend.property.repositories.PropertyImageRepository;
import com.petproject.itmoacsbackend.property.repositories.PropertyRepository;
import com.petproject.itmoacsbackend.reviews.dto.ReviewResponse;
import com.petproject.itmoacsbackend.users.dto.UserShortResponse;
import com.petproject.itmoacsbackend.users.entities.UserEntity;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PropertyService {

    private final AmenityService amenityService;
    private final PropertyRepository propertyRepository;
    private final PropertyImageRepository propertyImageRepository;

    @Transactional
    public PropertyResponse createProperty(CreatePropertyRequest request, UserEntity user) {

        if (!user.getIsLandlord()) {
            throw new SecurityException("Only landlords can create properties");
        }

        PropertyEntity property = PropertyEntity.builder()
                .userId(user)
                .title(request.title())
                .description(request.description())
                .price(request.price())
                .square(request.square())
                .type(request.type())
                .country(request.country())
                .city(request.city())
                .region(request.region())
                .street(request.street())
                .postalCode(request.postalCode())
                .nearestSubway(request.nearestSubway())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .mainImage(request.mainImage())
                .available(request.available() != null ? request.available() : false)
                .build();

        PropertyEntity savedProperty = propertyRepository.save(property);

        if (request.amenities() != null && !request.amenities().isEmpty()) {
            savedProperty.setAmenities(amenityService.findOrCreateAmenities(request.amenities()));
        }

        if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            List<PropertyImageEntity> images = request.imageUrls().stream()
                    .map(url -> PropertyImageEntity.builder()
                            .propertyId(savedProperty)
                            .url(url)
                            .build())
                    .toList();

            savedProperty.setPropertyImages(propertyImageRepository.saveAll(images));
        }
        log.info("Created property with id {}", savedProperty.getId());
        return mapToResponse(propertyRepository.save(savedProperty));
    }

    public Page<PropertyResponse> getAllProperties(int page, int size) {
        Pageable pageable = PageRequest.of(page, size,  Sort.by("createdAt"));

        Page<PropertyEntity> properties = propertyRepository.findAll(pageable);

        return properties.map(this::mapToResponse);
    }

    public PropertyResponse findById(Long id) {
        PropertyEntity property =  propertyRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Property with id " + id + " not found")
        );
        return mapToResponse(property);
    }

    public Page<PropertyResponse> getFilteredProperties(PropertyFilterRequest filter, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
            Page<PropertyEntity> properties = propertyRepository.searchByKeyword(filter.getKeyword(), pageable);
            return properties.map(this::mapToResponse);
        }

        Page<PropertyEntity> properties = propertyRepository.findByFilters(
                filter.getAvailable(),
                filter.getType(),
                filter.getCountry(),
                filter.getRegion(),
                filter.getCity(),
                filter.getNearestSubway(),
                filter.getMinPrice(),
                filter.getMaxPrice(),
                filter.getMinSquare(),
                filter.getMaxSquare(),
                pageable
        );

        return properties.map(this::mapToResponse);
    }

    @Transactional
    public PropertyResponse updateProperty(Long id, UpdatePropertyRequest request, UserEntity user) {
        PropertyEntity property = propertyRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Property with id " + id + " not found")
        );

        if (!property.getUserId().getId().equals(user.getId()) && !user.getGlobalRole().equals(GlobalRole.ADMIN)) {
            throw new SecurityException("You are not the owner of this property");
        }

        if (request.title() != null) property.setTitle(request.title());
        if (request.description() != null) property.setDescription(request.description());
        if (request.price() != null) property.setPrice(request.price());
        if (request.square() != null) property.setSquare(request.square());
        if (request.type() != null) property.setType(request.type());
        if (request.country() != null) property.setCountry(request.country());
        if (request.region() != null) property.setRegion(request.region());
        if (request.city() != null) property.setCity(request.city());
        if (request.street() != null) property.setStreet(request.street());
        if (request.postalCode() != null) property.setPostalCode(request.postalCode());
        if (request.nearestSubway() != null) property.setNearestSubway(request.nearestSubway());
        if (request.latitude() != null) property.setLatitude(request.latitude());
        if (request.longitude() != null) property.setLongitude(request.longitude());
        if (request.available() != null) property.setAvailable(request.available());
        if (request.mainImage() != null) property.setMainImage(request.mainImage());


        if (request.amenities() != null) {
            property.setAmenities(amenityService.findOrCreateAmenities(request.amenities()));
        }

        PropertyEntity updatedProperty = propertyRepository.save(property);
        log.info("Updated property with id {}", updatedProperty.getId());
        return mapToResponse(updatedProperty);
    }


    private PropertyResponse mapToResponse(PropertyEntity request) {
        return PropertyResponse.builder()
                .id(request.getId())
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .square(request.getSquare())
                .type(request.getType())
                .country(request.getCountry())
                .city(request.getCity())
                .street(request.getStreet())
                .postalCode(request.getPostalCode())
                .nearestSubway(request.getNearestSubway())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .mainImage(request.getMainImage())
                .available(request.getAvailable() != null ? request.getAvailable() : false)
                .avgRating(request.getAvgRating())
                .owner(UserShortResponse.builder()
                            .id(request.getUserId().getId())
                            .username(request.getUserId().getUsername())
                            .email(request.getUserId().getEmail())
                            .phoneNumber(request.getUserId().getPhoneNumber())
                            .firstName(request.getUserId().getFirstName())
                            .lastName(request.getUserId().getLastName())
                            .patronymic(request.getUserId().getPatronymic())
                            .build()
                )
                .images(request.getPropertyImages() != null ?
                        request.getPropertyImages().stream()
                                .map(img -> ImageResponse.builder()
                                        .id(img.getId())
                                        .url(img.getUrl())
                                        .build())
                                .toList() : List.of())
                .amenities(request.getAmenities() != null ?
                        request.getAmenities().stream()
                                .map(AmenityEntity::getName)
                                .toList() :
                        List.of())
                .createdAt(request.getCreatedAt())
                .build();
    }

    @Transactional
    public void deletePropertyById(Long id, UserEntity user) {
        PropertyEntity property = propertyRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Property with id " + id + " not found")
        );

        if (!property.getUserId().getId().equals(user.getId()) && !user.getGlobalRole().equals(GlobalRole.ADMIN) ) {
            throw new SecurityException("You are not the owner of this property");
        }

        propertyRepository.delete(property);
        log.info("Deleted property with id {}", id);
    }

    @Transactional
    public List<ImageResponse> updateImagesOfProperty(Long propertyId, List<String> imageUrls, UserEntity user) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                                                    .orElseThrow(() -> new EntityNotFoundException("Property with id " + propertyId + " not found"));

        if (!property.getUserId().getId().equals(user.getId())) {
            throw new SecurityException("You are not the owner of this property");
        }

        List<PropertyImageEntity> newImages = imageUrls.stream()
                                                       .map(url -> PropertyImageEntity.builder()
                                                                                      .propertyId(property)
                                                                                      .url(url)
                                                                                      .build())
                                                       .toList();

        List<PropertyImageEntity> savedImages = propertyImageRepository.saveAll(newImages);
        property.getPropertyImages().addAll(savedImages);
        propertyRepository.save(property);

        log.info("Added {} images to property {}", imageUrls.size(), propertyId);

        return savedImages.stream()
                          .map(img -> ImageResponse.builder()
                                                   .id(img.getId())
                                                   .url(img.getUrl())
                                                   .build())
                          .toList();
    }

    @Transactional
    public void deleteImageFromProperty(Long propertyId, Long imageId, UserEntity user) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                                                    .orElseThrow(() -> new EntityNotFoundException("Property with id " + propertyId + " not found"));

        if (!property.getUserId().getId().equals(user.getId())) {
            throw new SecurityException("You are not the owner of this property");
        }

        PropertyImageEntity image = propertyImageRepository.findById(imageId)
                                                           .orElseThrow(() -> new EntityNotFoundException("Image with id " + imageId + " not found"));

        if (!image.getPropertyId().getId().equals(propertyId)) {
            throw new IllegalArgumentException("Image does not belong to this property");
        }

        property.getPropertyImages().remove(image);
        propertyImageRepository.delete(image);

        log.info("Deleted image {} from property {}", imageId, propertyId);
    }

    public Page<PropertyResponse> getAllUserProperties(UserEntity user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PropertyEntity> properties = propertyRepository.findAllByUserId(user, pageable);
        return properties.map(this::mapToResponse);
    }
}
