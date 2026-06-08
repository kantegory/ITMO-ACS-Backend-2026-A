package org.rentservice.service.Address;

import org.rentservice.data.request.AddressRequest;
import org.rentservice.data.response.AddressResponse;

import java.util.List;

public interface AddressService {

    AddressResponse create(AddressRequest request);

    AddressResponse getById(Long id);

    List<AddressResponse> getAll();

    void delete(Long id);




}

