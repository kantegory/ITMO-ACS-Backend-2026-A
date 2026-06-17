package org.renting.rentingservice.dto.listing;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddPhotoRequest {
    @NotBlank
    private String url;
    private Boolean isMain;
}
