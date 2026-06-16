package org.renting.rentingservice.dto.listing;

import jakarta.validation.constraints.Size;
import lombok.Data;
import org.renting.rentingservice.domain.enums.HouseType;

@Data
public class UpdateListingRequest {
    @Size(min = 3, max = 100)
    private String title;
    private String description;

    @Size(min = 5)
    private String address;

    private Double latitude;
    private Double longitude;
    private HouseType houseType;
    private Boolean isActive;
}
