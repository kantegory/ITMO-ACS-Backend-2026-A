package org.renting.rentingservice.dto.rent;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.renting.rentingservice.domain.enums.CommunicationMethod;

@Data
public class CreateRentRequest {
    @NotNull
    private Long listingId;

    @NotNull
    private CommunicationMethod communicationMethod;
}
