package org.rentservice.service.contract;

import org.rentservice.data.request.ContractRequest;
import org.rentservice.data.response.ContractResponse;

import java.util.List;
public interface ContractService {

    ContractResponse create(
            ContractRequest request
    );

    ContractResponse getById(Long id);

    List<ContractResponse> getAll();


    void delete(Long id);

}
