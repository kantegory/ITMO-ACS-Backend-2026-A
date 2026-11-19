package com.petproject.itmoacsbackend.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public record UserUpdateRequest (

    String firstName,

    String lastName,

    String patronymic,

    @Pattern(
            regexp = "^\\+?[0-9. ()-]{7,25}$",
            message = "Phone number is invalid"
    )
    String phoneNumber,

    @Email
    String email
    )
{ }
