package org.rentservice.data.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserShortDto {

    private Long id;

    private String firstName;
    private String lastName;
}