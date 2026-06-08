package org.rentservice.controller;

import lombok.RequiredArgsConstructor;
import org.rentservice.data.request.ContractRequest;
import org.rentservice.data.response.ContractResponse;
import org.rentservice.service.contract.ContractService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    public ContractResponse create(
            @RequestBody ContractRequest request
    ) {
        return contractService.create(request);
    }

    @GetMapping("/{id}")
    public ContractResponse getById(
            @PathVariable Long id
    ) {
        return contractService.getById(id);
    }

    @GetMapping
    public List<ContractResponse> getAll() {
        return contractService.getAll();
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {
        contractService.delete(id);
    }
}