package org.rentservice.data.mapper;


import org.mapstruct.Mapper;
import org.rentservice.data.entity.Photo;
import org.rentservice.data.response.PhotoResponse;

import java.util.List;

@Mapper(
 componentModel = "spring"
)
public interface PhotoMapper {
    PhotoResponse toResponse(Photo photo);

    List<PhotoResponse> toResponseList(List<Photo> photos);
}
