package org.rentservice.service.Photo;

import org.rentservice.data.request.PhotoRequest;
import org.rentservice.data.response.PhotoResponse;

import java.util.List;

public interface PhotoService {

    PhotoResponse create(
            PhotoRequest request
    );

    List<PhotoResponse> getByRealty(
            Long realtyId
    );

    void delete(Long id);


}
