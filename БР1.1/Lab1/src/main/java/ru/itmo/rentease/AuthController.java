package ru.itmo.rentease;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.Domain.*;
import ru.itmo.rentease.repo.AccountRepository;
import ru.itmo.rentease.repo.UserRoleRepository;

import static ru.itmo.rentease.ApiDtos.*;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final AccountRepository accounts;
    private final UserRoleRepository roles;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(AccountRepository accounts, UserRoleRepository roles,
                          PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.accounts = accounts;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @GetMapping("/health")
    HealthResponse health() {
        return new HealthResponse("healthy");
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    UserResponse register(@Valid @RequestBody RegisterRequest request) {
        if (accounts.existsByEmail(request.email())) {
            throw AppException.conflict("Email is already registered");
        }
        Role requestedRole = request.role() == null ? Role.tenant : request.role();
        if (requestedRole == Role.admin) {
            throw AppException.forbidden("Admin self-registration is disabled");
        }
        Account account = new Account();
        account.email = request.email();
        account.passwordHash = passwordEncoder.encode(request.password());
        account.fullName = request.fullName();
        account.phone = request.phone();
        account.role = roles.findById(requestedRole).orElseThrow(() -> AppException.notFound("Role not found"));
        return UserResponse.from(accounts.save(account));
    }

    @PostMapping("/auth/login")
    TokenResponse login(@Valid @RequestBody LoginRequest request) {
        Account account = accounts.findByEmail(request.email())
                .orElseThrow(() -> AppException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), account.passwordHash)) {
            throw AppException.unauthorized("Invalid email or password");
        }
        String role = account.role.name.name();
        return new TokenResponse(jwtService.accessToken(account.id, role), jwtService.refreshToken(account.id, role), "bearer");
    }

    @GetMapping("/users/me")
    @SecurityRequirement(name = "bearerAuth")
    UserResponse me() {
        return UserResponse.from(accounts.findById(SecurityConfig.currentUserId())
                .orElseThrow(() -> AppException.notFound("User not found")));
    }
}
