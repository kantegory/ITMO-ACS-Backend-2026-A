package com.petproject.propertyservice.controllers;


import com.petproject.propertyservice.dto.*;
import com.petproject.propertyservice.security.JwtPrincipal;
import com.petproject.propertyservice.service.PropertyService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/properties")
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping
    public ResponseEntity<Page<PropertyResponse>> getAllProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<PropertyResponse> response = propertyService.getAllProperties(page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody CreatePropertyRequest request,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        PropertyResponse response = propertyService.createProperty(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/filter")
    public ResponseEntity<Page<PropertyResponse>> filterProperties(
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String nearestSubway,
            @RequestParam(required = false) Float minPrice,
            @RequestParam(required = false) Float maxPrice,
            @RequestParam(required = false) Float minSquare,
            @RequestParam(required = false) Float maxSquare,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        country = country != null ? country : "";
        region = region != null ? region : "";
        city = city != null ? city : "";
        nearestSubway = nearestSubway != null ? nearestSubway : "";

        PropertyFilterRequest filter = new PropertyFilterRequest();
        filter.setAvailable(available);
        filter.setType(type);
        filter.setCountry(country);
        filter.setRegion(region);
        filter.setCity(city);
        filter.setNearestSubway(nearestSubway);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        filter.setMinSquare(minSquare);
        filter.setMaxSquare(maxSquare);
        filter.setKeyword(keyword);

        Page<PropertyResponse> response = propertyService.getFilteredProperties(filter, page, size);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getPropertyById(@PathVariable Long id) {
        PropertyResponse response = propertyService.findById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePropertyRequest request,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        PropertyResponse response = propertyService.updateProperty(id, request, user);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        propertyService.deletePropertyById(id, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/images")
    public ResponseEntity<List<ImageResponse>> uploadImage(
            @PathVariable Long id,
            @RequestBody @Valid UpdatePropertyImage request,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        List<ImageResponse> response = propertyService.updateImagesOfProperty(id, request.getImages(), user);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);


    }

    @DeleteMapping("/{propertyId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long propertyId,
            @PathVariable Long imageId,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        propertyService.deleteImageFromProperty(propertyId, imageId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{property_id}/is_exists")
    public ResponseEntity<Boolean> isPropertyExists(
            @PathVariable("property_id") Long propertyId,
            @AuthenticationPrincipal JwtPrincipal user
    ) {
        Boolean response = propertyService.checkIfExists(propertyId, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{property_id}/owner")
    public ResponseEntity<Long> getOwnerId(
            @PathVariable("property_id") Long propertyId
    ) {
        Long response = propertyService.findOwnerById(propertyId);
        return ResponseEntity.ok(response);
    }


}
