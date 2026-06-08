package org.rentservice.data.response;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RealtyResponse {

    private Long id;

    private UserShortDto owner;

    private AddressResponse address;

    private String realtyClass;

    private Boolean renovated;

    private Boolean dishwasher;

    private Boolean kitchen;

    private Boolean balcony;

    private String totalRooms;

    private String totalBathrooms;

    private String totalBedrooms;
}