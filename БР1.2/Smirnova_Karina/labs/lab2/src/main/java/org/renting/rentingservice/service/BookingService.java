package org.renting.rentingservice.service;

import lombok.RequiredArgsConstructor;
import org.renting.rentingservice.domain.entity.BookingEntity;
import org.renting.rentingservice.domain.entity.ListingDailyEntity;
import org.renting.rentingservice.domain.entity.ListingEntity;
import org.renting.rentingservice.domain.entity.UserEntity;
import org.renting.rentingservice.domain.enums.BookingStatus;
import org.renting.rentingservice.domain.enums.RentMode;
import org.renting.rentingservice.dto.booking.BookingResponse;
import org.renting.rentingservice.dto.booking.CreateBookingRequest;
import org.renting.rentingservice.dto.common.PageResponse;
import org.renting.rentingservice.exception.BusinessException;
import org.renting.rentingservice.exception.ConflictException;
import org.renting.rentingservice.exception.ForbiddenException;
import org.renting.rentingservice.exception.NotFoundException;
import org.renting.rentingservice.mapper.BookingMapper;
import org.renting.rentingservice.messaging.NotificationEvent;
import org.renting.rentingservice.messaging.NotificationEventPublisher;
import org.renting.rentingservice.repository.BookingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final List<BookingStatus> ACTIVE_STATUSES =
            List.copyOf(EnumSet.of(BookingStatus.PENDING, BookingStatus.ACCEPTED));

    private final BookingRepository bookingRepository;
    private final ListingService listingService;
    private final UserDirectoryService userDirectoryService;
    private final BookingMapper bookingMapper;
    private final NotificationEventPublisher notificationEventPublisher;

    @Transactional
    public BookingResponse create(Long guestId, CreateBookingRequest request) {
        ListingEntity listing = listingService.findListing(request.getListingId());
        if (listing.getRentMode() != RentMode.DAILY) {
            throw new BusinessException("Bookings are only allowed for DAILY listings");
        }
        if (!listing.isActive()) {
            throw new BusinessException("Listing is not active");
        }
        if (listing.getOwner() != null && listing.getOwner().getId().equals(guestId)) {
            throw new BusinessException("Cannot book your own listing");
        }
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new BusinessException("endDate must be after startDate");
        }
        ListingDailyEntity daily = listing.getDaily();
        if (daily == null) {
            throw new BusinessException("Listing has no daily pricing configured");
        }
        long nights = request.getEndDate().toEpochDay() - request.getStartDate().toEpochDay();
        if (nights < daily.getMinNights()) {
            throw new BusinessException("Minimum nights requirement not met");
        }
        if (daily.getMaxNights() != null && nights > daily.getMaxNights()) {
            throw new BusinessException("Maximum nights exceeded");
        }
        if (bookingRepository.existsOverlappingBooking(
                listing.getId(), request.getStartDate(), request.getEndDate(), ACTIVE_STATUSES)) {
            throw new ConflictException("Dates overlap with an existing booking");
        }
        UserEntity guest = userDirectoryService.getOrSyncUser(guestId);
        BigDecimal total = daily.getPricePerNight().multiply(BigDecimal.valueOf(nights));
        BookingEntity booking = BookingEntity.builder()
                .listing(listing)
                .guest(guest)
                .status(BookingStatus.PENDING)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .pricePerNightSnapshot(daily.getPricePerNight())
                .totalAmount(total)
                .build();
        BookingEntity saved = bookingRepository.save(booking);
        publishBookingEvent("BOOKING_CREATED", saved);
        return bookingMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> listForGuest(Long guestId, BookingStatus status, Pageable pageable) {
        Page<BookingEntity> page = status != null
                ? bookingRepository.findByGuestIdAndStatus(guestId, status, pageable)
                : bookingRepository.findByGuestId(guestId, pageable);
        List<BookingResponse> content = page.getContent().stream().map(bookingMapper::toResponse).toList();
        return PageResponse.from(page, content);
    }

    @Transactional(readOnly = true)
    public BookingResponse get(Long bookingId, Long userId) {
        BookingEntity booking = findBooking(bookingId);
        assertGuestOrOwner(booking, userId);
        return bookingMapper.toResponse(booking);
    }

    @Transactional
    public BookingResponse cancel(Long bookingId, Long userId) {
        BookingEntity booking = findBooking(bookingId);
        assertGuestOrOwner(booking, userId);
        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new ConflictException("Booking cannot be canceled in current status");
        }
        booking.setStatus(BookingStatus.CANCELED);
        BookingEntity saved = bookingRepository.save(booking);
        publishBookingEvent("BOOKING_CANCELED", saved);
        return bookingMapper.toResponse(saved);
    }

    @Transactional
    public BookingResponse complete(Long bookingId, Long userId) {
        BookingEntity booking = findBooking(bookingId);
        assertGuestOrOwner(booking, userId);
        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new ConflictException("Only accepted bookings can be completed");
        }
        if (LocalDate.now().isBefore(booking.getEndDate())) {
            throw new ConflictException("Booking can be completed only on or after checkout date");
        }
        booking.setStatus(BookingStatus.COMPLETED);
        BookingEntity saved = bookingRepository.save(booking);
        publishBookingEvent("BOOKING_COMPLETED", saved);
        return bookingMapper.toResponse(saved);
    }

    public BookingEntity findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    public void assertGuestOrOwner(BookingEntity booking, Long userId) {
        boolean guest = booking.getGuest().getId().equals(userId);
        boolean owner = booking.getListing().getOwner() != null
                && booking.getListing().getOwner().getId().equals(userId);
        if (!guest && !owner) {
            throw new ForbiddenException("Access denied to this booking");
        }
    }

    @Transactional
    public void markAccepted(BookingEntity booking) {
        booking.setStatus(BookingStatus.ACCEPTED);
        bookingRepository.save(booking);
        publishBookingEvent("BOOKING_ACCEPTED", booking);
    }

    private void publishBookingEvent(String eventType, BookingEntity booking) {
        String ownerEmail = booking.getListing().getOwner() != null ? booking.getListing().getOwner().getEmail() : null;
        if (ownerEmail == null || ownerEmail.isBlank()) {
            return;
        }
        notificationEventPublisher.publish(NotificationEvent.builder()
                .eventType(eventType)
                .email(ownerEmail)
                .subject("Booking update: " + eventType)
                .content("Booking #" + booking.getId() + " status is " + booking.getStatus())
                .build());
    }
}
