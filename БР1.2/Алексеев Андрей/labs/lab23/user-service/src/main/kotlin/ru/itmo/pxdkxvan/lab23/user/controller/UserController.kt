package ru.itmo.pxdkxvan.lab23.user.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.user.dto.UserUpdateRequest
import ru.itmo.pxdkxvan.lab23.user.service.UserService

@RestController
@RequestMapping("/users")
@SecurityRequirement(name = "bearerAuth")
class UserController(
    private val userService: UserService,
) {
    @GetMapping("/me")
    fun me(@AuthenticationPrincipal authentication: Jwt) = userService.me(authentication)

    @PatchMapping("/me")
    fun update(@AuthenticationPrincipal authentication: Jwt, @RequestBody request: UserUpdateRequest) =
        userService.update(authentication, request)
}
