package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.*;
import org.renting.rentingservice.domain.enums.HouseType;
import org.renting.rentingservice.domain.enums.RentMode;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.dto.listing.*;
import org.renting.rentingservice.exception.BusinessException;
import org.renting.rentingservice.exception.ForbiddenException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.mapper.ListingMapper;
import org.renting.rentingservice.repository.ListingPhotoRepository;
import org.renting.rentingservice.repository.ListingRepository;
import org.renting.rentingservice.repository.spec.ListingSpecifications;
import org.renting.rentingservice.util.GeoUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final ListingPhotoRepository photoRepository;
    private final UserDirectoryService userDirectoryService;
    private final ListingMapper listingMapper;

    @Transactional
    public ListingResponse create(Long ownerId, CreateListingRequest request) {
        UserEntity owner = userDirectoryService.getOrSyncUser(ownerId);
        validateRentModePayload(request);

        ListingEntity listing = ListingEntity.builder()
                .owner(owner)
                .rentMode(request.getRentMode())
                .title(request.getTitle())
                .description(request.getDescription())
                .address(request.getAddress())
                .location(toPoint(request.getLatitude(), request.getLongitude()))
                .houseType(request.getHouseType())
                .active(true)
                .build();

        if (request.getRentMode() == RentMode.DAILY) {
            ListingDailyDto d = request.getDaily();
            ListingDailyEntity daily = ListingDailyEntity.builder()
                    .listing(listing)
                    .pricePerNight(d.getPricePerNight())
                    .minNights(d.getMinNights() > 0 ? d.getMinNights() : 1)
                    .maxNights(d.getMaxNights())
                    .checkInTime(d.getCheckInTime())
                    .checkOutTime(d.getCheckOutTime())
                    .build();
            listing.setDaily(daily);
        } else {
            ListingMonthlyDto m = request.getMonthly();
            ListingMonthlyEntity monthly = ListingMonthlyEntity.builder()
                    .listing(listing)
                    .pricePerMonth(m.getPricePerMonth())
                    .deposit(m.getDeposit() != null ? m.getDeposit() : BigDecimal.ZERO)
                    .communalPayments(m.isCommunalPayments())
                    .minMonth(m.getMinMonth())
                    .build();
            listing.setMonthly(monthly);
        }

        return listingMapper.toResponse(listingRepository.save(listing));
    }

    @Transactional(readOnly = true)
    public PageResponse<ListingResponse> search(
            RentMode rentMode,
            HouseType houseType,
            BigDecimal priceMin,
            BigDecimal priceMax,
            Double lat,
            Double lng,
            Double radiusKm,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {
        List<Specification<ListingEntity>> specs = new ArrayList<>();
        specs.add(ListingSpecifications.activeOnly());
        specs.add(ListingSpecifications.rentMode(rentMode));
        specs.add(ListingSpecifications.houseType(houseType));
        specs.add(ListingSpecifications.priceRange(rentMode, priceMin, priceMax));
        if (startDate != null && endDate != null) {
            specs.add(ListingSpecifications.availableBetween(startDate, endDate));
        }
        if (lat != null && lng != null && radiusKm != null && radiusKm > 0) {
            specs.add(ListingSpecifications.withinRadius(lat, lng, radiusKm));
        }

        Specification<ListingEntity> combined = specs.stream()
                .reduce(Specification::and)
                .orElse((root, query, cb) -> cb.conjunction());

        Page<ListingEntity> page = listingRepository.findAll(combined, pageable);
        List<ListingResponse> content = page.getContent().stream()
                .map(listingMapper::toResponse)
                .toList();
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public ListingResponse get(Long listingId) {
        return listingMapper.toResponse(findListing(listingId));
    }

    @Transactional(readOnly = true)
    public ListingDetailsResponse getDetails(Long listingId) {
        ListingEntity listing = findListing(listingId);
        List<PhotoResponse> photos = photoRepository.findByListingIdOrderByUploadedAtAsc(listingId).stream()
                .map(listingMapper::toPhotoResponse)
                .toList();
        return ListingDetailsResponse.builder()
                .listing(listingMapper.toResponse(listing))
                .daily(listing.getDaily() != null ? listingMapper.toDailyResponse(listing.getDaily()) : null)
                .monthly(listing.getMonthly() != null ? listingMapper.toMonthlyResponse(listing.getMonthly()) : null)
                .photos(photos)
                .build();
    }

    @Transactional
    public ListingResponse update(Long listingId, Long userId, UpdateListingRequest request) {
        ListingEntity listing = findListing(listingId);
        assertOwner(listing, userId);
        if (request.getTitle() != null) {
            listing.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            listing.setDescription(request.getDescription());
        }
        if (request.getAddress() != null) {
            listing.setAddress(request.getAddress());
        }
        if (request.getLatitude() != null || request.getLongitude() != null) {
            Double lat = request.getLatitude() != null ? request.getLatitude() : GeoUtils.latitude(listing.getLocation());
            Double lng = request.getLongitude() != null ? request.getLongitude() : GeoUtils.longitude(listing.getLocation());
            listing.setLocation(toPoint(lat, lng));
        }
        if (request.getHouseType() != null) {
            listing.setHouseType(request.getHouseType());
        }
        if (request.getIsActive() != null) {
            listing.setActive(request.getIsActive());
        }
        return listingMapper.toResponse(listingRepository.save(listing));
    }

    @Transactional
    public void activate(Long listingId, Long userId) {
        ListingEntity listing = findListing(listingId);
        assertOwner(listing, userId);
        listing.setActive(true);
        listingRepository.save(listing);
    }

    @Transactional
    public void deactivate(Long listingId, Long userId) {
        ListingEntity listing = findListing(listingId);
        assertOwner(listing, userId);
        listing.setActive(false);
        listingRepository.save(listing);
    }

    @Transactional
    public PhotoResponse addPhoto(Long listingId, Long userId, AddPhotoRequest request) {
        ListingEntity listing = findListing(listingId);
        assertOwner(listing, userId);
        boolean isMain = Boolean.TRUE.equals(request.getIsMain());
        if (isMain) {
            clearMainPhoto(listingId);
        }
        ListingPhotoEntity photo = ListingPhotoEntity.builder()
                .listing(listing)
                .url(request.getUrl())
                .main(isMain || photoRepository.countByListingId(listingId) == 0)
                .build();
        return listingMapper.toPhotoResponse(photoRepository.save(photo));
    }

    @Transactional(readOnly = true)
    public List<PhotoResponse> listPhotos(Long listingId) {
        findListing(listingId);
        return photoRepository.findByListingIdOrderByUploadedAtAsc(listingId).stream()
                .map(listingMapper::toPhotoResponse)
                .toList();
    }

    @Transactional
    public PhotoResponse updatePhoto(Long listingId, Long photoId, Long userId, UpdatePhotoRequest request) {
        ListingEntity listing = findListing(listingId);
        assertOwner(listing, userId);
        ListingPhotoEntity photo = photoRepository.findByIdAndListingId(photoId, listingId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));
        if (Boolean.TRUE.equals(request.getIsMain())) {
            clearMainPhoto(listingId);
            photo.setMain(true);
        } else if (request.getIsMain() != null && !request.getIsMain()) {
            photo.setMain(false);
        }
        return listingMapper.toPhotoResponse(photoRepository.save(photo));
    }

    @Transactional
    public void deletePhoto(Long listingId, Long photoId, Long userId) {
        ListingEntity listing = findListing(listingId);
        assertOwner(listing, userId);
        ListingPhotoEntity photo = photoRepository.findByIdAndListingId(photoId, listingId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));
        photoRepository.delete(photo);
    }

    public ListingEntity findListing(Long listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new NotFoundException("Listing not found"));
    }

    public void assertOwner(ListingEntity listing, Long userId) {
        if (listing.getOwner() == null || !listing.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Only the listing owner can perform this action");
        }
    }

    private void clearMainPhoto(Long listingId) {
        photoRepository.findByListingIdOrderByUploadedAtAsc(listingId).forEach(p -> {
            if (p.isMain()) {
                p.setMain(false);
                photoRepository.save(p);
            }
        });
    }

    private void validateRentModePayload(CreateListingRequest request) {
        if (request.getRentMode() == RentMode.DAILY && request.getDaily() == null) {
            throw new BusinessException("Daily pricing details are required for DAILY listings");
        }
        if (request.getRentMode() == RentMode.MONTHLY && request.getMonthly() == null) {
            throw new BusinessException("Monthly pricing details are required for MONTHLY listings");
        }
    }

    private org.locationtech.jts.geom.Point toPoint(Double lat, Double lng) {
        if (lat == null || lng == null) {
            return null;
        }
        return GeoUtils.point(lat, lng);
    }
}
