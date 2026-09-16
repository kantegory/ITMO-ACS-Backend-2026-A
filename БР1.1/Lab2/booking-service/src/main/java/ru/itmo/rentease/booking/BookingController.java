package ru.itmo.rentease.booking;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class BookingController {
    private final BookingRepository bookings;
    private final BookingStatusHistoryRepository history;
    private final InternalHttpClient internal;
    private final String propertyServiceUrl;
    private final String contractServiceUrl;

    public BookingController(BookingRepository bookings,
                             BookingStatusHistoryRepository history,
                             InternalHttpClient internal,
                             @Value("${property-service.url:http://localhost:8082}") String propertyServiceUrl,
                             @Value("${contract-service.url:http://localhost:8084}") String contractServiceUrl) {
        this.bookings = bookings;
        this.history = history;
        this.internal = internal;
        this.propertyServiceUrl = propertyServiceUrl;
        this.contractServiceUrl = contractServiceUrl;
    }

    @GetMapping("/health")
    ApiDtos.HealthResponse health() {
        return new ApiDtos.HealthResponse("healthy", "booking-service");
    }

    @GetMapping("/bookings")
    List<ApiDtos.BookingResponse> list(@RequestParam(required = false) BookingStatus status) {
        UUID userId = SecurityConfig.currentUserId();
        Role role = SecurityConfig.currentRole();
        List<BookingEntity> result;
        if (role == Role.tenant) {
            result = status == null ? bookings.findByTenantIdOrderByCreatedAtDesc(userId)
                    : bookings.findByTenantIdAndStatusOrderByCreatedAtDesc(userId, status);
        } else if (role == Role.landlord) {
            result = status == null ? bookings.findByLandlordIdOrderByCreatedAtDesc(userId)
                    : bookings.findByLandlordIdAndStatusOrderByCreatedAtDesc(userId, status);
        } else if (role == Role.admin) {
            result = bookings.findAll(org.springframework.data.domain.Sort.by(
                    org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
            if (status != null) result = result.stream().filter(item -> item.status == status).toList();
        } else {
            throw AppException.forbidden("Insufficient role");
        }
        return result.stream().map(this::response).toList();
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    ApiDtos.BookingResponse create(@Valid @RequestBody ApiDtos.BookingRequest request) {
        SecurityConfig.requireRole(Role.tenant);
        if (request.endDate().isBefore(request.startDate())) {
            throw AppException.badRequest("End date must not be before start date");
        }
        ApiDtos.PropertySummary property = internal.get(propertyServiceUrl,
                "/internal/properties/" + request.propertyId() + "/summary", ApiDtos.PropertySummary.class);
        if (bookings.existsOverlapping(request.propertyId(), request.startDate(), request.endDate(),
                List.of(BookingStatus.pending, BookingStatus.confirmed))) {
            throw AppException.conflict("Selected dates are already booked");
        }
        BookingEntity booking = new BookingEntity();
        booking.tenantId = SecurityConfig.currentUserId();
        booking.propertyId = request.propertyId();
        booking.landlordId = property.landlordId();
        booking.startDate = request.startDate();
        booking.endDate = request.endDate();
        booking.message = request.message();
        booking.status = BookingStatus.pending;
        return response(bookings.save(booking));
    }

    @PatchMapping("/bookings/{bookingId}/status")
    ApiDtos.BookingResponse changeStatus(@PathVariable UUID bookingId,
                                         @Valid @RequestBody ApiDtos.BookingStatusRequest request) {
        SecurityConfig.requireRole(Role.landlord, Role.admin);
        BookingEntity booking = bookings.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Booking not found"));
        UUID actor = SecurityConfig.currentUserId();
        if (SecurityConfig.currentRole() != Role.admin && !booking.landlordId.equals(actor)) {
            throw AppException.forbidden("Only the property landlord can change booking status");
        }
        if (request.status() != BookingStatus.confirmed && request.status() != BookingStatus.cancelled) {
            throw AppException.badRequest("Only confirmed or cancelled status is allowed");
        }
        if (booking.status == request.status()) return response(booking);
        if (booking.status != BookingStatus.pending) {
            throw AppException.conflict("Only pending booking can be changed");
        }
        if (request.status() == BookingStatus.confirmed) {
            internal.post(contractServiceUrl, "/internal/contracts",
                    new ApiDtos.ContractCreateRequest(booking.id, booking.propertyId, booking.tenantId,
                            booking.landlordId, propertyRent(booking.propertyId)), ApiDtos.ContractResponse.class);
        }
        BookingStatus previous = booking.status;
        booking.status = request.status();
        bookings.save(booking);
        BookingStatusHistoryEntity event = new BookingStatusHistoryEntity();
        event.bookingId = booking.id;
        event.fromStatus = previous;
        event.toStatus = booking.status;
        event.changedBy = actor;
        history.save(event);
        return response(booking);
    }

    private java.math.BigDecimal propertyRent(UUID propertyId) {
        return internal.get(propertyServiceUrl, "/internal/properties/" + propertyId + "/summary",
                ApiDtos.PropertySummary.class).monthlyRent();
    }

    private ApiDtos.BookingResponse response(BookingEntity booking) {
        return new ApiDtos.BookingResponse(booking.id, booking.propertyId, booking.tenantId, booking.landlordId,
                booking.startDate, booking.endDate, booking.status, booking.message);
    }
}
