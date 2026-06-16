package org.renting.rentingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.renting.rentingservice.domain.enums.HouseType;
import org.renting.rentingservice.domain.enums.RentMode;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.dto.listing.*;
import org.renting.rentingservice.security.SecurityUtils;
import org.renting.rentingservice.service.ListingService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/listings")
@Tag(name = "Listings", description = "Объявления и фотографии")
public class ListingController {

    private final ListingService listingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Создать объявление", description = "Создаёт новое объявление с данными аренды и координатами")
    public ListingResponse create(@Valid @RequestBody CreateListingRequest request) {
        return listingService.create(SecurityUtils.currentUserId(), request);
    }

    @GetMapping
    @Operation(summary = "Поиск объявлений", description = "Возвращает список объявлений по фильтрам, цене, датам и радиусу")
    public PageResponse<ListingResponse> search(
            @RequestParam(required = false) RentMode rentMode,
            @RequestParam(required = false) HouseType houseType,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        return listingService.search(rentMode, houseType, priceMin, priceMax, lat, lng, radiusKm, startDate, endDate, pageable);
    }

    @GetMapping("/{listingId}")
    @Operation(summary = "Детали объявления", description = "Возвращает полную информацию об объявлении и его фото")
    public ListingDetailsResponse get(@PathVariable Long listingId) {
        return listingService.getDetails(listingId);
    }

    @PatchMapping("/{listingId}")
    @Operation(summary = "Обновить объявление", description = "Изменяет основные поля объявления владельцем")
    public ListingResponse update(@PathVariable Long listingId, @Valid @RequestBody UpdateListingRequest request) {
        return listingService.update(listingId, SecurityUtils.currentUserId(), request);
    }

    @PostMapping("/{listingId}/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Активировать объявление", description = "Включает показ объявления в поиске")
    public void activate(@PathVariable Long listingId) {
        listingService.activate(listingId, SecurityUtils.currentUserId());
    }

    @PostMapping("/{listingId}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Деактивировать объявление", description = "Скрывает объявление из поиска")
    public void deactivate(@PathVariable Long listingId) {
        listingService.deactivate(listingId, SecurityUtils.currentUserId());
    }

    @PostMapping("/{listingId}/photos")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Добавить фото", description = "Добавляет фотографию к объявлению")
    public PhotoResponse addPhoto(@PathVariable Long listingId, @Valid @RequestBody AddPhotoRequest request) {
        return listingService.addPhoto(listingId, SecurityUtils.currentUserId(), request);
    }

    @GetMapping("/{listingId}/photos")
    @Operation(summary = "Список фото", description = "Возвращает все фотографии объявления")
    public List<PhotoResponse> listPhotos(@PathVariable Long listingId) {
        return listingService.listPhotos(listingId);
    }

    @PatchMapping("/{listingId}/photos/{photoId}")
    @Operation(summary = "Обновить фото", description = "Меняет признак основного фото или другие параметры фото")
    public PhotoResponse updatePhoto(
            @PathVariable Long listingId,
            @PathVariable Long photoId,
            @Valid @RequestBody UpdatePhotoRequest request) {
        return listingService.updatePhoto(listingId, photoId, SecurityUtils.currentUserId(), request);
    }

    @DeleteMapping("/{listingId}/photos/{photoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Удалить фото", description = "Удаляет фотографию из объявления")
    public void deletePhoto(@PathVariable Long listingId, @PathVariable Long photoId) {
        listingService.deletePhoto(listingId, photoId, SecurityUtils.currentUserId());
    }
}
