package org.renting.rentingservice.dto.booking;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateBookingRequest {
    @NotNull
    private Long listingId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
