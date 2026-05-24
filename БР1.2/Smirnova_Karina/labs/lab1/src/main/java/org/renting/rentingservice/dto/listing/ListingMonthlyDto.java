package org.renting.rentingservice.dto.listing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ListingMonthlyDto {
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal pricePerMonth;

    private BigDecimal deposit = BigDecimal.ZERO;
    private boolean communalPayments;
    private Integer minMonth;
}
