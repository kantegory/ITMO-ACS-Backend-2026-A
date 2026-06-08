package org.rentservice.data.response;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddressResponse {

    private Long id;

    private String cityName;

    private String street;

    private String buildingNumber;
}
