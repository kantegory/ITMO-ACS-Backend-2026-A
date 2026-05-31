package ru.itmo.pxdkxvan.lab1.user.controller

import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.role.dto.RoleAssignRequest
import ru.itmo.pxdkxvan.lab1.user.dto.UserResponse
import ru.itmo.pxdkxvan.lab1.user.dto.UserUpdateRequest
import ru.itmo.pxdkxvan.lab1.auth.service.AuthService
import ru.itmo.pxdkxvan.lab1.role.service.RoleService
import java.util.UUID

@RestController
@RequestMapping("/users")
class UserController(
    private val authService: AuthService,
    private val roleService: RoleService,
) {
    @GetMapping("/me")
    fun me(@AuthenticationPrincipal jwt: Jwt): UserResponse = authService.currentUser(jwt)

    @PatchMapping("/me")
    fun updateMe(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: UserUpdateRequest): UserResponse =
        authService.updateCurrentUser(jwt, request)

    @PostMapping("/{userId}/roles")
    fun addRole(
        @AuthenticationPrincipal jwt: Jwt,
        @PathVariable userId: UUID,
        @Valid @RequestBody request: RoleAssignRequest,
    ): UserResponse = roleService.addRoleToUser(jwt, userId, request)
}
