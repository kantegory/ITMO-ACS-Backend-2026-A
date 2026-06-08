package org.rentservice.service.Realty;


import org.rentservice.data.request.RealtyRequest;
import org.rentservice.data.request.UpdateRealtyRequest;
import org.rentservice.data.response.RealtyResponse;

import java.util.List;

public interface RealtyService {
    RealtyResponse create(
            RealtyRequest request
    );

    RealtyResponse getById(Long id);

    List<RealtyResponse> getAll();

    RealtyResponse update(
            Long id,
            UpdateRealtyRequest request
    );

    void delete(Long id);




}
