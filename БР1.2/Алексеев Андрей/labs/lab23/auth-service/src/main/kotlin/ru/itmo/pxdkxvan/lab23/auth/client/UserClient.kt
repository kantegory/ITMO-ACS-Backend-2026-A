package ru.itmo.pxdkxvan.lab23.auth.client

import org.springframework.cloud.openfeign.FeignClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import ru.itmo.pxdkxvan.lab23.auth.dto.AuthContextResponse
import ru.itmo.pxdkxvan.lab23.auth.dto.UserRegistrationRequest
import java.util.UUID

@FeignClient(name = "userClient", url = "\${app.clients.user-url}")
interface UserClient {
    @PostMapping("/internal/users")
    fun createUser(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @RequestBody request: UserRegistrationRequest,
    ): AuthContextResponse

    @GetMapping("/internal/users/{userId}/auth-context")
    fun getAuthContext(
        @RequestHeader("X-Service-Token") serviceToken: String,
        @PathVariable userId: UUID,
    ): AuthContextResponse
}
