package com.petproject.propertyservice.dto;

import lombok.Builder;

@Builder
public record UserShortResponse(
        Long id,
        String username,

        String email,

        String phoneNumber,

        String firstName,

        String lastName,

        String patronymic
) {
}
