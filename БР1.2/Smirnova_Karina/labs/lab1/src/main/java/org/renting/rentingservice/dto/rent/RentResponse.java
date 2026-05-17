package org.renting.rentingservice.dto.rent;

import lombok.Builder;
import lombok.Value;
import org.renting.rentingservice.domain.enums.CommunicationMethod;
import org.renting.rentingservice.domain.enums.RentStatus;

import java.time.Instant;

@Value
@Builder
public class RentResponse {
    Long id;
    Long listingId;
    Long guestId;
    CommunicationMethod communicationMethod;
    RentStatus status;
    Instant createdAt;
}
