package org.renting.rentingservice.dto.rent;

import lombok.Data;
import org.renting.rentingservice.domain.enums.CommunicationMethod;
import org.renting.rentingservice.domain.enums.RentStatus;

@Data
public class UpdateRentRequest {
    private RentStatus status;
    private CommunicationMethod communicationMethod;
}
