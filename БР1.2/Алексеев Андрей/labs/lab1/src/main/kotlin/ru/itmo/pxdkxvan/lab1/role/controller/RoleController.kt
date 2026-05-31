package ru.itmo.pxdkxvan.lab1.role.controller

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab1.common.ItemsResponse
import ru.itmo.pxdkxvan.lab1.role.dto.RoleCreateRequest
import ru.itmo.pxdkxvan.lab1.role.dto.RoleResponse
import ru.itmo.pxdkxvan.lab1.role.service.RoleService

@RestController
@RequestMapping("/roles")
class RoleController(
    private val roleService: RoleService,
) {
    @GetMapping
    fun list(@AuthenticationPrincipal jwt: Jwt): ItemsResponse<RoleResponse> = roleService.listRoles(jwt)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: RoleCreateRequest): RoleResponse =
        roleService.createRole(jwt, request)
}
