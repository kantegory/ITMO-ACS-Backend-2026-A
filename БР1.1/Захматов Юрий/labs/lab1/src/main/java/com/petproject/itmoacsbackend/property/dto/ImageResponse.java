package com.petproject.itmoacsbackend.property.dto;

import lombok.Builder;

@Builder
public record ImageResponse(
        Long id,
        String url
) {

}
