package com.petproject.authservice.dto;

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
