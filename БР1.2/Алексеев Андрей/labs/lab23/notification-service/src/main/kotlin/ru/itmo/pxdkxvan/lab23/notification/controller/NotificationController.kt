package ru.itmo.pxdkxvan.lab23.notification.controller

import io.swagger.v3.oas.annotations.security.SecurityRequirement
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import ru.itmo.pxdkxvan.lab23.notification.service.NotificationService
import java.util.UUID

@RestController
@RequestMapping("/notifications")
@SecurityRequirement(name = "bearerAuth")
class NotificationController(
    private val notificationService: NotificationService,
) {
    @GetMapping
    fun list(
        @AuthenticationPrincipal authentication: Jwt,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = notificationService.my(authentication, page, limit)

    @PatchMapping("/{notificationId}/read")
    fun read(@AuthenticationPrincipal authentication: Jwt, @PathVariable notificationId: UUID) =
        notificationService.markRead(authentication, notificationId)

    @PatchMapping("/read-all")
    fun readAll(@AuthenticationPrincipal authentication: Jwt) = notificationService.markAllRead(authentication)
}
