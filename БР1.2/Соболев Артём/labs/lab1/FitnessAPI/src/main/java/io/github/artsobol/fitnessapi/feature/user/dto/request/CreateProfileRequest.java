package io.github.artsobol.fitnessapi.feature.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProfileRequest(
        @Size(max = 30, message = "{profile.firstName.size}")
        @NotBlank(message = "{profile.firstName.blank}")
        String firstName,

        @Size(max = 30, message = "{profile.lastName.size}")
        @NotBlank(message = "{profile.lastName.blank}")
        String lastName
) {
}
