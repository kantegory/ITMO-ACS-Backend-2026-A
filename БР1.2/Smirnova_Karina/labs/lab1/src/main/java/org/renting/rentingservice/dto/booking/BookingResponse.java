package org.renting.rentingservice.dto.booking;

import lombok.Builder;
import lombok.Value;
import org.renting.rentingservice.domain.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Value
@Builder
public class BookingResponse {
    Long id;
    Long listingId;
    Long guestId;
    BookingStatus status;
    LocalDate startDate;
    LocalDate endDate;
    BigDecimal pricePerNightSnapshot;
    BigDecimal totalAmount;
    Instant createdAt;
}
