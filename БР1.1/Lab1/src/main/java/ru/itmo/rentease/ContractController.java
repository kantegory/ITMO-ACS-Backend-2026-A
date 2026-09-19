package ru.itmo.rentease;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.itmo.rentease.repo.RentalContractRepository;

import java.util.List;

import static ru.itmo.rentease.ApiDtos.*;

@RestController
@RequestMapping("/api/v1/contracts")
@SecurityRequirement(name = "bearerAuth")
public class ContractController {
    private final RentalContractRepository contracts;

    public ContractController(RentalContractRepository contracts) {
        this.contracts = contracts;
    }

    @GetMapping
    List<ContractResponse> list() {
        return contracts.findVisibleToUser(SecurityConfig.currentUserId()).stream().map(ContractResponse::from).toList();
    }
}
