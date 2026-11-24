package ru.itmo.pxdkxvan.lab23.user.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.user.config.UserProperties
import ru.itmo.pxdkxvan.lab23.user.dto.UserRegistrationRequest
import ru.itmo.pxdkxvan.lab23.user.service.UserService
import java.util.UUID

@RestController
@RequestMapping("/internal/users")
class InternalUserController(
    private val userService: UserService,
    private val userProperties: UserProperties,
) {
    @PostMapping
    fun create(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @RequestBody request: UserRegistrationRequest,
    ) = userService.createInternal(serviceToken, userProperties.security.serviceToken, request)

    @GetMapping("/{userId}/auth-context")
    fun authContext(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable userId: UUID,
    ) = userService.authContext(serviceToken, userProperties.security.serviceToken, userId)

    @GetMapping("/{userId}/notification-context")
    fun notificationContext(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable userId: UUID,
    ) = userService.notificationContext(serviceToken, userProperties.security.serviceToken, userId)
}
