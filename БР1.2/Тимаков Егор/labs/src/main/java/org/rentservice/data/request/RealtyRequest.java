package org.rentservice.data.request;


import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.rentservice.data.entity.Address;
import org.rentservice.data.entity.Segment;
import org.rentservice.data.entity.User;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RealtyRequest {



    private Long addressId;

    private String realtyClass;

    private Boolean renovated;

    private Boolean dishwasher;

    private Boolean kitchen;

    private Boolean balcony;

    private String totalRooms;

    private String totalBathrooms;

    private String totalBedrooms;
}

