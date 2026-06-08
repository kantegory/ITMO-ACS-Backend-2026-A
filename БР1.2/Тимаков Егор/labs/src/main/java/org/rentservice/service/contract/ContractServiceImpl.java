package org.rentservice.service.contract;


import lombok.RequiredArgsConstructor;
import org.rentservice.data.entity.Contract;
import org.rentservice.data.entity.Realty;
import org.rentservice.data.entity.User;
import org.rentservice.data.mapper.ContractMapper;
import org.rentservice.data.request.ContractRequest;
import org.rentservice.data.response.ContractResponse;
import org.rentservice.repository.ContractRepository;
import org.rentservice.repository.RealtyRepository;
import org.rentservice.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class ContractServiceImpl
        implements ContractService {

    private final ContractRepository contractRepository;

    private final RealtyRepository realtyRepository;

    private final UserRepository userRepository;

    private final ContractMapper contractMapper;

    @Override
    public ContractResponse create(
            ContractRequest request
    ) {

        Realty realty =
                realtyRepository.findById(
                                request.getRealtyId())
                        .orElseThrow();

        User customer =
                userRepository.findById(
                                request.getCustomerId())
                        .orElseThrow();

        Contract contract = new Contract();

        contract.setRealty(realty);
        contract.setCustomer(customer);
        contract.setOfferType(
                request.getOfferType());
        contract.setPrice(
                request.getPrice());
        contract.setDescription(
                request.getDescription());

        contract.setCreated_at(
                new Date());

        return contractMapper.toResponse(
                contractRepository.save(
                        contract
                )
        );
    }

    @Override
    public ContractResponse getById(
            Long id
    ) {

        return contractMapper.toResponse(
                contractRepository.findById(id)
                        .orElseThrow()
        );
    }

    @Override
    public List<ContractResponse> getAll() {

        return contractRepository.findAll()
                .stream()
                .map(contractMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {

        contractRepository.deleteById(id);
    }
}
