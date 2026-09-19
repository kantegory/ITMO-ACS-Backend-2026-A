package ru.itmo.rentease;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.Domain.*;
import ru.itmo.rentease.repo.AccountRepository;
import ru.itmo.rentease.repo.PropertyRepository;

import java.math.BigDecimal;
import java.util.UUID;

import static ru.itmo.rentease.ApiDtos.*;

@RestController
@RequestMapping("/api/v1/properties")
public class PropertyController {
    private final PropertyRepository properties;
    private final AccountRepository accounts;

    public PropertyController(PropertyRepository properties, AccountRepository accounts) {
        this.properties = properties;
        this.accounts = accounts;
    }

    @GetMapping
    PageResponse<PropertyResponse> list(@RequestParam(required = false) String city,
                                        @RequestParam(name = "property_type", required = false) PropertyType propertyType,
                                        @RequestParam(name = "min_price", required = false) BigDecimal minPrice,
                                        @RequestParam(name = "max_price", required = false) BigDecimal maxPrice,
                                        @RequestParam(name = "rooms_count", required = false) Integer roomsCount,
                                        @RequestParam(defaultValue = "20") int limit,
                                        @RequestParam(defaultValue = "0") int offset) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int safeOffset = Math.max(0, offset);
        Specification<Property> spec = Specification.where((root, query, cb) -> cb.isTrue(root.get("isActive")));
        if (city != null && !city.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("city")), city.toLowerCase()));
        }
        if (propertyType != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("propertyType"), propertyType));
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("pricePerMonth"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("pricePerMonth"), maxPrice));
        }
        if (roomsCount != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("roomsCount"), roomsCount));
        }
        var all = properties.findAll(spec);
        var items = all.stream().skip(safeOffset).limit(safeLimit).map(PropertyResponse::from).toList();
        return new PageResponse<>(all.size(), items);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    PropertyResponse create(@Valid @RequestBody PropertyRequest request) {
        Account landlord = accounts.findById(SecurityConfig.currentUserId())
                .orElseThrow(() -> AppException.notFound("User not found"));
        if (landlord.role.name != Role.landlord && landlord.role.name != Role.admin) {
            throw AppException.forbidden("Only landlords can create properties");
        }
        Property property = new Property();
        property.landlord = landlord;
        property.title = request.title();
        property.description = request.description();
        property.propertyType = request.propertyType();
        property.pricePerMonth = request.pricePerMonth();
        property.securityDeposit = request.securityDeposit() == null ? BigDecimal.ZERO : request.securityDeposit();
        property.city = request.city();
        property.address = request.address();
        property.roomsCount = request.roomsCount();
        property.areaSqm = request.areaSqm();
        property.isActive = true;
        return PropertyResponse.from(properties.save(property));
    }

    @GetMapping("/{propertyId}")
    PropertyResponse get(@PathVariable UUID propertyId) {
        Property property = properties.findById(propertyId).orElseThrow(() -> AppException.notFound("Property not found"));
        if (!property.isActive) {
            throw AppException.notFound("Property not found");
        }
        return PropertyResponse.from(property);
    }
}
