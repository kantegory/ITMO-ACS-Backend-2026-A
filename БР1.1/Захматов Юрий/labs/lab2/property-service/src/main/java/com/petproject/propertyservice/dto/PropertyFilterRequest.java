package com.petproject.propertyservice.dto;

import lombok.Data;

@Data
public class PropertyFilterRequest {
    private Boolean available = true;
    private String type;
    private String country;
    private String city;
    private String region;
    private String nearestSubway;
    private Float minPrice;
    private Float maxPrice;
    private Float minSquare;
    private Float maxSquare;
    private String keyword;
}
