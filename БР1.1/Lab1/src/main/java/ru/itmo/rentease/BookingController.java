package ru.itmo.rentease;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.Domain.*;
import ru.itmo.rentease.repo.*;

import java.util.List;
import java.util.UUID;

import static ru.itmo.rentease.ApiDtos.*;

@RestController
@RequestMapping("/api/v1/bookings")
@SecurityRequirement(name = "bearerAuth")
public class BookingController {
    private final BookingRepository bookings;
    private final AccountRepository accounts;
    private final PropertyRepository properties;
    private final RentalContractRepository contracts;

    public BookingController(BookingRepository bookings, AccountRepository accounts,
                             PropertyRepository properties, RentalContractRepository contracts) {
        this.bookings = bookings;
        this.accounts = accounts;
        this.properties = properties;
        this.contracts = contracts;
    }

    @GetMapping
    List<BookingResponse> list(@RequestParam(required = false) BookingStatus status) {
        Account user = currentAccount();
        List<Booking> result;
        if (user.role.name == Role.landlord) {
            result = status == null ? bookings.findByLandlordId(user.id) : bookings.findByLandlordIdAndStatus(user.id, status);
        } else {
            result = status == null ? bookings.findByTenantId(user.id) : bookings.findByTenantIdAndStatus(user.id, status);
        }
        return result.stream().map(BookingResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    BookingResponse create(@Valid @RequestBody BookingRequest request) {
        Account tenant = currentAccount();
        if (tenant.role.name != Role.tenant && tenant.role.name != Role.admin) {
            throw AppException.forbidden("Only tenants can create bookings");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("endDate must be on or after startDate");
        }
        Property property = properties.findById(request.propertyId()).orElseThrow(() -> AppException.notFound("Property not found"));
        if (!property.isActive) {
            throw AppException.notFound("Property not found");
        }
        boolean overlaps = bookings.existsOverlappingBooking(property.id, request.startDate(), request.endDate(),
                List.of(BookingStatus.pending, BookingStatus.confirmed));
        if (overlaps) {
            throw AppException.conflict("Selected dates are already booked");
        }
        Booking booking = new Booking();
        booking.tenant = tenant;
        booking.property = property;
        booking.startDate = request.startDate();
        booking.endDate = request.endDate();
        booking.message = request.message();
        booking.status = BookingStatus.pending;
        return BookingResponse.from(bookings.save(booking));
    }

    @PatchMapping("/{bookingId}/status")
    BookingResponse status(@PathVariable UUID bookingId, @Valid @RequestBody BookingStatusRequest request) {
        Account user = currentAccount();
        Booking booking = bookings.findById(bookingId).orElseThrow(() -> AppException.notFound("Booking not found"));
        if (!booking.property.landlord.id.equals(user.id) && user.role.name != Role.admin) {
            throw AppException.forbidden("Only the landlord can change booking status");
        }
        if (request.status() != BookingStatus.confirmed && request.status() != BookingStatus.cancelled) {
            throw new IllegalArgumentException("status must be confirmed or cancelled");
        }
        booking.status = request.status();
        Booking saved = bookings.save(booking);
        if (saved.status == BookingStatus.confirmed && contracts.findByBookingId(saved.id).isEmpty()) {
            RentalContract contract = new RentalContract();
            contract.booking = saved;
            contract.contractNumber = "RE-" + saved.id.toString().substring(0, 8).toUpperCase();
            contract.monthlyRent = saved.property.pricePerMonth;
            contract.status = ContractStatus.active;
            contracts.save(contract);
        }
        return BookingResponse.from(saved);
    }

    private Account currentAccount() {
        return accounts.findById(SecurityConfig.currentUserId()).orElseThrow(() -> AppException.notFound("User not found"));
    }
}
