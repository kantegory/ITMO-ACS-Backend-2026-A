package com.petproject.authservice.dto;

import com.petproject.authservice.enums.GlobalRole;
import lombok.Builder;

@Builder
public record UserResponse (

        Long id,
        GlobalRole role,

        Boolean isRenter,

        Boolean isLandlord,

        String username,

        String email,

        String phoneNumber,

        String firstName,

        String lastName,

        String patronymic

) {

}
