package com.petproject.reviewsservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyRatingUpdateEvent {
    private Long propertyId;
    private Integer rating;
}
