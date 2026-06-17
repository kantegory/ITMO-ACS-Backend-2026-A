package org.renting.rentingservice.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Pattern(regexp = "^[+]?[0-9]+$")
    private String phone;

    @NotBlank
    @Size(min = 6)
    private String password;
}
