package ru.itmo.rentease.identity;

import org.springframework.web.bind.annotation.*;
import ru.itmo.rentease.common.ApiDtos;
import ru.itmo.rentease.common.SecurityConfig;

import java.util.UUID;

@RestController
@RequestMapping("/internal/users")
public class InternalUserController {
    private final UserRepository users;

    public InternalUserController(UserRepository users) { this.users = users; }

    @GetMapping("/{userId}/status")
    ApiDtos.UserStatusResponse status(@PathVariable UUID userId) {
        SecurityConfig.requireService();
        UserEntity user = users.findById(userId).orElse(null);
        if (user == null) return new ApiDtos.UserStatusResponse(userId, false, null);
        return new ApiDtos.UserStatusResponse(user.id, user.active, user.role);
    }
}
