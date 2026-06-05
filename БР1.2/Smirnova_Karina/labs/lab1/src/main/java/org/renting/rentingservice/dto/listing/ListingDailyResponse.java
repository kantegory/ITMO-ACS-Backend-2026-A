package org.renting.rentingservice.dto.listing;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class ListingDailyResponse {
    Long listingId;
    BigDecimal pricePerNight;
    int minNights;
    Integer maxNights;
    String checkInTime;
    String checkOutTime;
}
