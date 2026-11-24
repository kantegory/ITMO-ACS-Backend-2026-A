package ru.itmo.pxdkxvan.lab23.user.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.user.dto.RoleCreateRequest
import ru.itmo.pxdkxvan.lab23.user.service.UserService

@RestController
@RequestMapping("/roles")
class RoleController(
    private val userService: UserService,
) {
    @GetMapping
    @SecurityRequirement(name = "bearerAuth")
    fun list() = userService.listRoles()

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    fun create(@RequestBody request: RoleCreateRequest) = userService.createRole(request)
}
