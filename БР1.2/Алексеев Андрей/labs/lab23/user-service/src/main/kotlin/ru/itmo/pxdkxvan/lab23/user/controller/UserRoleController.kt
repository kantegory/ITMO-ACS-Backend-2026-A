package ru.itmo.pxdkxvan.lab23.user.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.user.dto.RoleAssignRequest
import ru.itmo.pxdkxvan.lab23.user.service.UserService
import java.util.UUID

@RestController
class UserRoleController(
    private val userService: UserService,
) {
    @PostMapping("/users/{userId}/roles")
    @SecurityRequirement(name = "bearerAuth")
    fun assign(@PathVariable userId: UUID, @RequestBody request: RoleAssignRequest) =
        userService.assignRole(userId, request)
}
