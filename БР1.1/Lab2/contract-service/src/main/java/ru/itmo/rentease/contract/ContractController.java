package ru.itmo.rentease.contract;

import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ContractController {
    private final ContractRepository contracts;

    public ContractController(ContractRepository contracts) {
        this.contracts = contracts;
    }

    @GetMapping("/health")
    ApiDtos.HealthResponse health() {
        return new ApiDtos.HealthResponse("healthy", "contract-service");
    }

    @GetMapping("/contracts")
    List<ApiDtos.ContractResponse> list() {
        UUID userId = SecurityConfig.currentUserId();
        Role role = SecurityConfig.currentRole();
        List<RentalContractEntity> result = switch (role) {
            case tenant -> contracts.findByTenantIdOrderByCreatedAtDesc(userId);
            case landlord -> contracts.findByLandlordIdOrderByCreatedAtDesc(userId);
            case admin -> contracts.findAll(org.springframework.data.domain.Sort.by(
                    org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        };
        return result.stream().map(this::response).toList();
    }

    private ApiDtos.ContractResponse response(RentalContractEntity contract) {
        return new ApiDtos.ContractResponse(contract.id, contract.bookingId, contract.propertyId,
                contract.tenantId, contract.landlordId, contract.contractNumber, contract.monthlyRent, contract.status);
    }
}
