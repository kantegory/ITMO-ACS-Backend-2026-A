package org.rentservice.data.response;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CityResponse {

    private Long id;

    private String cityName;
}