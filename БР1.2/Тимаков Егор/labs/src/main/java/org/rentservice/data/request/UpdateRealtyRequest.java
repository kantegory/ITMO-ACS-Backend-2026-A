package org.rentservice.data.request;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.AnyKeyJavaClass;
import org.rentservice.data.entity.Segment;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateRealtyRequest {

    private Segment realtySegment;

    private Boolean renovated;

    private Boolean dishwasher;

    private Boolean kitchen;

    private Boolean balcony;

    private String totalRooms;

    private String totalBathrooms;

    private String totalBedrooms;
}
