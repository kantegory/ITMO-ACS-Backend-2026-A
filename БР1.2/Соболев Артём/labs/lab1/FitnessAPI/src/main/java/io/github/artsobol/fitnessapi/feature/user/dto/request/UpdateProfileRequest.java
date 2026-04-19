package io.github.artsobol.fitnessapi.feature.user.dto.request;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.NullOrNotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NullOrNotBlank(message = "{profile.firstname.blank}")
        @Size(max = 30, message = "{profile.firstName.size}")
        String firstName,
        @NullOrNotBlank(message = "{profile.lastname.blank}")
        @Size(max = 30, message = "{profile.lastName.size}")
        String lastName
) {
}
