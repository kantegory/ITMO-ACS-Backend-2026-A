package ru.itmo.rentease.contract;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.*;

import java.util.UUID;

@RestController
@RequestMapping("/internal/contracts")
public class InternalContractController {
    private final ContractRepository contracts;

    public InternalContractController(ContractRepository contracts) {
        this.contracts = contracts;
    }

    @PostMapping
    ResponseEntity<ApiDtos.ContractResponse> create(@RequestBody ApiDtos.ContractCreateRequest request) {
        SecurityConfig.requireService();
        RentalContractEntity existing = contracts.findByBookingId(request.bookingId()).orElse(null);
        if (existing != null) {
            if (!existing.propertyId.equals(request.propertyId()) || !existing.tenantId.equals(request.tenantId())
                    || !existing.landlordId.equals(request.landlordId())) {
                throw AppException.conflict("Contract already exists with different participants");
            }
            return ResponseEntity.ok(response(existing));
        }
        RentalContractEntity contract = new RentalContractEntity();
        contract.bookingId = request.bookingId();
        contract.propertyId = request.propertyId();
        contract.tenantId = request.tenantId();
        contract.landlordId = request.landlordId();
        contract.monthlyRent = request.monthlyRent();
        contract.contractNumber = "RE-" + request.bookingId().toString().substring(0, 8).toUpperCase();
        return ResponseEntity.status(201).body(response(contracts.save(contract)));
    }

    @GetMapping("/{contractId}/review-eligibility")
    ApiDtos.EligibilityResponse eligibility(@PathVariable UUID contractId,
                                             @RequestParam("author_id") UUID authorId) {
        SecurityConfig.requireService();
        RentalContractEntity contract = contracts.findById(contractId)
                .orElseThrow(() -> AppException.notFound("Contract not found"));
        if (contract.status != ContractStatus.completed) {
            return new ApiDtos.EligibilityResponse(false, "CONTRACT_NOT_COMPLETED");
        }
        if (!contract.tenantId.equals(authorId) && !contract.landlordId.equals(authorId)) {
            return new ApiDtos.EligibilityResponse(false, "AUTHOR_NOT_PARTICIPANT");
        }
        return new ApiDtos.EligibilityResponse(true, null);
    }

    private ApiDtos.ContractResponse response(RentalContractEntity contract) {
        return new ApiDtos.ContractResponse(contract.id, contract.bookingId, contract.propertyId,
                contract.tenantId, contract.landlordId, contract.contractNumber, contract.monthlyRent, contract.status);
    }
}
