package org.renting.rentingservice.dto.listing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ListingDailyDto {
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal pricePerNight;

    @Min(1)
    private int minNights = 1;

    private Integer maxNights;
    private String checkInTime;
    private String checkOutTime;
}
