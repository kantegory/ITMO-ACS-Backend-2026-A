package ru.itmo.rentease;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.Domain.*;
import ru.itmo.rentease.repo.AccountRepository;
import ru.itmo.rentease.repo.FavoriteRepository;
import ru.itmo.rentease.repo.PropertyRepository;

import java.util.List;

import static ru.itmo.rentease.ApiDtos.*;

@RestController
@RequestMapping("/api/v1/favorites")
@SecurityRequirement(name = "bearerAuth")
public class FavoriteController {
    private final FavoriteRepository favorites;
    private final AccountRepository accounts;
    private final PropertyRepository properties;

    public FavoriteController(FavoriteRepository favorites, AccountRepository accounts, PropertyRepository properties) {
        this.favorites = favorites;
        this.accounts = accounts;
        this.properties = properties;
    }

    @GetMapping
    List<PropertyResponse> list() {
        return favorites.findByUserId(SecurityConfig.currentUserId()).stream()
                .map(favorite -> favorite.property)
                .map(PropertyResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    void add(@Valid @RequestBody FavoriteRequest request) {
        var userId = SecurityConfig.currentUserId();
        if (favorites.existsByUserIdAndPropertyId(userId, request.propertyId())) {
            return;
        }
        Account user = accounts.findById(userId).orElseThrow(() -> AppException.notFound("User not found"));
        Property property = properties.findById(request.propertyId()).orElseThrow(() -> AppException.notFound("Property not found"));
        Favorite favorite = new Favorite();
        favorite.user = user;
        favorite.property = property;
        favorites.save(favorite);
    }
}
