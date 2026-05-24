package org.renting.rentingservice.dto.listing;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class ListingMonthlyResponse {
    Long listingId;
    BigDecimal pricePerMonth;
    BigDecimal deposit;
    boolean communalPayments;
    Integer minMonth;
}
