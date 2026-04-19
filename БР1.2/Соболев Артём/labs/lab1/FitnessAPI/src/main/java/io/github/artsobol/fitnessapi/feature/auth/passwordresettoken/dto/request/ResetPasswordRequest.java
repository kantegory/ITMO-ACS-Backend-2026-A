package io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.PasswordMatches;
import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@PasswordMatches
public record ResetPasswordRequest(
        @NotBlank(message = "{auth.reset.password.token.blank}")
        String token,

        @ValidPassword
        @NotBlank(message = "{auth.reset.password.blank}")
        String password,

        @NotBlank(message = "pauth.reset.password.confirm.blank")
        String confirmPassword
) {
}
