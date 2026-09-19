package ru.itmo.rentease.property;

import jakarta.validation.Valid;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.ApiDtos;
import ru.itmo.rentease.common.AppException;
import ru.itmo.rentease.common.Role;
import ru.itmo.rentease.common.SecurityConfig;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class PropertyController {
    private final PropertyRepository properties;
    private final FavoriteRepository favorites;

    public PropertyController(PropertyRepository properties, FavoriteRepository favorites) {
        this.properties = properties;
        this.favorites = favorites;
    }

    @GetMapping("/health")
    ApiDtos.HealthResponse health() { return new ApiDtos.HealthResponse("healthy", "property-service"); }

    @GetMapping("/properties")
    ApiDtos.PageResponse<ApiDtos.PropertyResponse> list(@RequestParam(required = false) String city,
                                                        @RequestParam(name = "property_type", required = false) ru.itmo.rentease.common.PropertyType propertyType,
                                                        @RequestParam(name = "min_price", required = false) BigDecimal minPrice,
                                                        @RequestParam(name = "max_price", required = false) BigDecimal maxPrice,
                                                        @RequestParam(name = "rooms_count", required = false) Integer roomsCount,
                                                        @RequestParam(defaultValue = "20") int limit,
                                                        @RequestParam(defaultValue = "0") int offset) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int safeOffset = Math.max(0, offset);
        Specification<PropertyEntity> spec = (root, query, cb) -> cb.isTrue(root.get("active"));
        if (city != null && !city.isBlank()) spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("city")), city.toLowerCase()));
        if (propertyType != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("propertyType"), propertyType));
        if (minPrice != null) spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("pricePerMonth"), minPrice));
        if (maxPrice != null) spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("pricePerMonth"), maxPrice));
        if (roomsCount != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("roomsCount"), roomsCount));
        List<PropertyEntity> all = properties.findAll(spec);
        List<ApiDtos.PropertyResponse> items = all.stream().skip(safeOffset).limit(safeLimit).map(this::response).toList();
        return new ApiDtos.PageResponse<>(all.size(), items);
    }

    @PostMapping("/properties")
    @ResponseStatus(HttpStatus.CREATED)
    ApiDtos.PropertyResponse create(@Valid @RequestBody ApiDtos.PropertyRequest request) {
        SecurityConfig.requireRole(Role.landlord, Role.admin);
        PropertyEntity property = new PropertyEntity();
        property.landlordId = SecurityConfig.currentUserId();
        property.title = request.title();
        property.description = request.description();
        property.propertyType = request.propertyType();
        property.pricePerMonth = request.pricePerMonth();
        property.securityDeposit = request.securityDeposit() == null ? BigDecimal.ZERO : request.securityDeposit();
        property.city = request.city();
        property.address = request.address();
        property.roomsCount = request.roomsCount();
        property.areaSqm = request.areaSqm();
        return response(properties.save(property));
    }

    @GetMapping("/properties/{propertyId}")
    ApiDtos.PropertyResponse get(@PathVariable UUID propertyId) { return response(activeProperty(propertyId)); }

    @GetMapping("/favorites")
    List<ApiDtos.PropertyResponse> favoriteList() {
        return favorites.findByUserId(SecurityConfig.currentUserId()).stream()
                .map(item -> properties.findById(item.propertyId).orElse(null))
                .filter(java.util.Objects::nonNull).filter(item -> item.active).map(this::response).toList();
    }

    @PostMapping("/favorites")
    @ResponseStatus(HttpStatus.CREATED)
    void favorite(@Valid @RequestBody ApiDtos.FavoriteRequest request) {
        if (favorites.existsByUserIdAndPropertyId(SecurityConfig.currentUserId(), request.propertyId())) return;
        activeProperty(request.propertyId());
        FavoriteEntity favorite = new FavoriteEntity();
        favorite.userId = SecurityConfig.currentUserId();
        favorite.propertyId = request.propertyId();
        favorites.save(favorite);
    }

    private PropertyEntity activeProperty(UUID id) {
        PropertyEntity property = properties.findById(id).orElseThrow(() -> AppException.notFound("Property not found"));
        if (!property.active) throw AppException.notFound("Property not found");
        return property;
    }

    private ApiDtos.PropertyResponse response(PropertyEntity property) {
        return new ApiDtos.PropertyResponse(property.id, property.landlordId, property.title, property.description,
                property.propertyType, property.pricePerMonth, property.securityDeposit, property.city, property.address,
                property.roomsCount, property.areaSqm, property.active);
    }
}
