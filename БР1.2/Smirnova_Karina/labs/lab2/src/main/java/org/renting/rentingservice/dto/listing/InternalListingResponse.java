package org.renting.rentingservice.dto.listing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.renting.rentingservice.domain.enums.HouseType;
import org.renting.rentingservice.domain.enums.RentMode;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalListingResponse {
    Long id;
    Long ownerId;
    RentMode rentMode;
    String title;
    String description;
    String address;
    Double lat;
    Double lng;
    HouseType houseType;
    boolean active;
    Instant createdAt;
}
