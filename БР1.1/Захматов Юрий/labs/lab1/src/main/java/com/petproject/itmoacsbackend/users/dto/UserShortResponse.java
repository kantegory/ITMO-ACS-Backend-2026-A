package com.petproject.itmoacsbackend.users.dto;

import com.petproject.itmoacsbackend.auth.enums.GlobalRole;
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
