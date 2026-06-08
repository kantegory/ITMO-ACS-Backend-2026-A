package org.rentservice.data.response;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PhotoResponse {

    private Long id;

    private String path;
}
