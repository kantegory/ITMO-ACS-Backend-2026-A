package ru.itmo.rentease.property;

import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.ApiDtos;
import ru.itmo.rentease.common.SecurityConfig;

import java.util.UUID;

@RestController
@RequestMapping("/internal/properties")
public class InternalPropertyController {
    private final PropertyRepository properties;

    public InternalPropertyController(PropertyRepository properties) { this.properties = properties; }

    @GetMapping("/{propertyId}/summary")
    ApiDtos.PropertySummary summary(@PathVariable UUID propertyId) {
        SecurityConfig.requireService();
        PropertyEntity property = properties.findById(propertyId).orElseThrow(() -> ru.itmo.rentease.common.AppException.notFound("Property not found"));
        if (!property.active) throw ru.itmo.rentease.common.AppException.notFound("Property not found");
        return new ApiDtos.PropertySummary(property.id, property.landlordId, true, property.pricePerMonth);
    }

    @GetMapping("/{propertyId}/ownership")
    ApiDtos.OwnershipResponse ownership(@PathVariable UUID propertyId,
                                        @RequestParam("user_id") UUID userId) {
        SecurityConfig.requireService();
        PropertyEntity property = properties.findById(propertyId).orElseThrow(() -> ru.itmo.rentease.common.AppException.notFound("Property not found"));
        return new ApiDtos.OwnershipResponse(property.id, property.landlordId, property.active,
                property.landlordId.equals(userId));
    }
}
