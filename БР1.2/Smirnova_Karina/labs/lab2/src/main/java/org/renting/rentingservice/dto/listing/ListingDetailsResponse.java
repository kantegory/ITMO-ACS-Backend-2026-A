package org.renting.rentingservice.dto.listing;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ListingDetailsResponse {
    ListingResponse listing;
    ListingDailyResponse daily;
    ListingMonthlyResponse monthly;
    List<PhotoResponse> photos;
}
