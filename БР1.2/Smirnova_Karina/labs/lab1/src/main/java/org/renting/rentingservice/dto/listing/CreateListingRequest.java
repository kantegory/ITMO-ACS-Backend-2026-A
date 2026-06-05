package org.renting.rentingservice.dto.listing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.renting.rentingservice.domain.enums.HouseType;
import org.renting.rentingservice.domain.enums.RentMode;

@Data
public class CreateListingRequest {
    @NotNull
    private RentMode rentMode;

    @NotBlank
    @Size(min = 3, max = 100)
    private String title;

    private String description;

    @NotBlank
    @Size(min = 5)
    private String address;

    private Double latitude;
    private Double longitude;

    @NotNull
    private HouseType houseType;

    @Valid
    private ListingDailyDto daily;

    @Valid
    private ListingMonthlyDto monthly;
}
