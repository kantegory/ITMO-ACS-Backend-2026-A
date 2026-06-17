package org.renting.rentingservice.dto.listing;

import lombok.Builder;
import lombok.Value;
import org.renting.rentingservice.domain.enums.HouseType;
import org.renting.rentingservice.domain.enums.RentMode;

import java.time.Instant;

@Value
@Builder
public class ListingResponse {
    Long id;
    Long ownerId;
    RentMode rentMode;
    String title;
    String description;
    String address;
    Double lat;
    Double lng;
    HouseType houseType;
    boolean isActive;
    Instant createdAt;
}
