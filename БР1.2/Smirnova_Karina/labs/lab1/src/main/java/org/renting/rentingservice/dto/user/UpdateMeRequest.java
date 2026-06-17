package org.renting.rentingservice.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateMeRequest {
    @Size(min = 3, max = 50)
    private String username;

    @Email
    private String email;

    @Pattern(regexp = "^[+]?[0-9]+$")
    private String phone;

    @Size(min = 6)
    private String password;
}
