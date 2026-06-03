package com.petproject.propertyservice.dto;

import lombok.Builder;

@Builder
public record ImageResponse(
        Long id,
        String url
) {

}
