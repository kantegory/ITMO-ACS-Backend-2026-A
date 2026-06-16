package org.renting.rentingservice.dto.listing;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class PhotoResponse {
    Long id;
    Long listingId;
    String url;
    Instant uploadedAt;
    boolean isMain;
}
