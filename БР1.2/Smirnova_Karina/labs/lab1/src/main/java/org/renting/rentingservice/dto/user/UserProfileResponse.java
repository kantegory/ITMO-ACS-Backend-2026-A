package org.renting.rentingservice.dto.user;

import lombok.Builder;
import lombok.Value;
import org.renting.rentingservice.dto.booking.BookingResponse;
import org.renting.rentingservice.dto.listing.ListingResponse;
import org.renting.rentingservice.dto.rent.RentResponse;

import java.time.Instant;
import java.util.List;

@Value
@Builder
public class UserProfileResponse {
    Long id;
    String username;
    String phone;
    boolean verified;
    Instant createdAt;
    List<ListingResponse> ownedListings;
    List<BookingResponse> guestBookingHistory;
    List<RentResponse> guestRentHistory;
    List<BookingResponse> ownerBookingHistory;
    List<RentResponse> ownerRentHistory;
}
