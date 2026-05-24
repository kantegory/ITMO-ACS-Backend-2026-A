package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.ListingEntity;
import org.renting.rentingservice.domain.entity.RentEntity;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.domain.enums.CommunicationMethod;
import org.renting.rentingservice.domain.enums.RentMode;
import org.renting.rentingservice.domain.enums.RentStatus;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.dto.rent.CreateRentRequest;
import org.renting.rentingservice.dto.rent.RentResponse;
import org.renting.rentingservice.dto.rent.UpdateRentRequest;
import org.renting.rentingservice.exception.BusinessException;
import org.renting.rentingservice.exception.ConflictException;
import org.renting.rentingservice.exception.ForbiddenException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.mapper.RentMapper;
import org.renting.rentingservice.messaging.NotificationEvent;
import org.renting.rentingservice.messaging.NotificationEventPublisher;
import org.renting.rentingservice.repository.RentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RentService {

    private final RentRepository rentRepository;
    private final ListingService listingService;
    private final UserDirectoryService userDirectoryService;
    private final CommunicationChatGateway communicationChatGateway;
    private final RentMapper rentMapper;
    private final NotificationEventPublisher notificationEventPublisher;

    @Transactional
    public RentResponse create(Long guestId, CreateRentRequest request) {
        ListingEntity listing = listingService.findListing(request.getListingId());
        if (listing.getRentMode() != RentMode.MONTHLY) {
            throw new BusinessException("Rent inquiries are only for MONTHLY listings");
        }
        if (!listing.isActive()) {
            throw new BusinessException("Listing is not active");
        }
        if (listing.getOwner() != null && listing.getOwner().getId().equals(guestId)) {
            throw new BusinessException("Cannot create rent inquiry for own listing");
        }
        Optional<RentEntity> existingRent = rentRepository.findByListingIdAndGuestIdAndStatusIn(
                request.getListingId(),
                guestId,
                List.of(RentStatus.NEW, RentStatus.IN_PROGRESS)
        );

        if (existingRent.isPresent()) {
            RentEntity rent = existingRent.get();

            if (request.getCommunicationMethod() == CommunicationMethod.CHAT && listing.getOwner() != null) {
                communicationChatGateway.ensureChatForListing(listing.getId(), guestId, listing.getOwner().getId());
            }

            return rentMapper.toResponse(rent);
        }

        UserEntity guest = userDirectoryService.getOrSyncUser(guestId);
        RentEntity rent = RentEntity.builder()
                .listing(listing)
                .guest(guest)
                .communicationMethod(request.getCommunicationMethod())
                .status(RentStatus.NEW)
                .build();
        rent = rentRepository.save(rent);
        if (request.getCommunicationMethod() == CommunicationMethod.CHAT && listing.getOwner() != null) {
            communicationChatGateway.ensureChatForListing(listing.getId(), guestId, listing.getOwner().getId());
        }
        publishRentEvent("RENT_CREATED", rent);
        return rentMapper.toResponse(rent);
    }

    @Transactional(readOnly = true)
    public PageResponse<RentResponse> list(Long guestId, RentStatus status, Pageable pageable) {
        Page<RentEntity> page = status != null
                ? rentRepository.findByGuestIdAndStatus(guestId, status, pageable)
                : rentRepository.findByGuestId(guestId, pageable);
        List<RentResponse> content = page.getContent().stream().map(rentMapper::toResponse).toList();
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public RentResponse get(Long rentId, Long userId) {
        RentEntity rent = findRent(rentId);
        assertGuestOrOwner(rent, userId);
        return rentMapper.toResponse(rent);
    }

    @Transactional
    public RentResponse update(Long rentId, Long userId, UpdateRentRequest request) {
        RentEntity rent = findRent(rentId);
        assertOwner(rent, userId);
        if (request.getStatus() != null) {
            validateStatusTransition(rent.getStatus(), request.getStatus());
            rent.setStatus(request.getStatus());
        }
        if (request.getCommunicationMethod() != null) {
            rent.setCommunicationMethod(request.getCommunicationMethod());
        }
        return rentMapper.toResponse(rentRepository.save(rent));
    }

    @Transactional
    public RentResponse close(Long rentId, Long userId) {
        RentEntity rent = findRent(rentId);
        assertOwner(rent, userId);
        if (rent.getStatus() == RentStatus.CLOSED) {
            throw new ConflictException("Rent is already closed");
        }
        rent.setStatus(RentStatus.CLOSED);
        RentEntity saved = rentRepository.save(rent);
        publishRentEvent("RENT_CLOSED", saved);
        return rentMapper.toResponse(saved);
    }

    private void validateStatusTransition(RentStatus current, RentStatus next) {
        if (current == RentStatus.CLOSED) {
            throw new ConflictException("Closed rent cannot be updated");
        }
        if (current == RentStatus.NEW && next == RentStatus.CLOSED) {
            return;
        }
        if (current == RentStatus.NEW && next == RentStatus.IN_PROGRESS) {
            return;
        }
        if (current == RentStatus.IN_PROGRESS && (next == RentStatus.CLOSED || next == RentStatus.IN_PROGRESS)) {
            return;
        }
        if (current == RentStatus.IN_PROGRESS && next == RentStatus.NEW) {
            throw new ConflictException("Invalid status transition");
        }
    }

    private RentEntity findRent(Long rentId) {
        return rentRepository.findById(rentId)
                .orElseThrow(() -> new NotFoundException("Rent not found"));
    }

    private void assertGuestOrOwner(RentEntity rent, Long userId) {
        boolean guest = rent.getGuest().getId().equals(userId);
        boolean owner = rent.getListing().getOwner() != null
                && rent.getListing().getOwner().getId().equals(userId);
        if (!guest && !owner) {
            throw new ForbiddenException("Access denied");
        }
    }

    private void assertOwner(RentEntity rent, Long userId) {
        if (rent.getListing().getOwner() == null || !rent.getListing().getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Only listing owner can update rent");
        }
    }

    private void publishRentEvent(String eventType, RentEntity rent) {
        String ownerEmail = rent.getListing().getOwner() != null ? rent.getListing().getOwner().getEmail() : null;
        if (ownerEmail == null || ownerEmail.isBlank()) {
            return;
        }
        notificationEventPublisher.publish(NotificationEvent.builder()
                .eventType(eventType)
                .email(ownerEmail)
                .subject("Rent update: " + eventType)
                .content("Rent #" + rent.getId() + " status is " + rent.getStatus())
                .build());
    }
}
