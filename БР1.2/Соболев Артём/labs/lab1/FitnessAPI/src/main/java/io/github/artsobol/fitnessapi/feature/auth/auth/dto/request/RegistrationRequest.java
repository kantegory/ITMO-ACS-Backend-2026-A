package io.github.artsobol.fitnessapi.feature.auth.auth.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.PasswordMatches;
import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.ValidPassword;
import io.github.artsobol.fitnessapi.infrastructure.validation.contract.PasswordConfirmation;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@PasswordMatches
public record RegistrationRequest(
        @Size(max = 64, message = "auth.user.username.long")
        @NotBlank(message = "auth.user.username.blank")
        String username,

        @Email(message = "auth.user.email.invalid")
        @NotBlank(message = "auth.user.email.blank")
        String email,

        @ValidPassword
        @NotBlank(message = "auth.user.password.blank")
        String password,

        @NotBlank(message = "auth.user.password.confirm.blank")
        String confirmPassword
) implements PasswordConfirmation {
}
