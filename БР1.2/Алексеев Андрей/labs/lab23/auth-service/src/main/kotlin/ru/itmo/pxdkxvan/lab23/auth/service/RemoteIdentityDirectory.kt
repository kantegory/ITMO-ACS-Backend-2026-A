package ru.itmo.pxdkxvan.lab23.auth.service

import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab23.auth.client.UserClient
import ru.itmo.pxdkxvan.lab23.auth.config.AuthProperties
import ru.itmo.pxdkxvan.lab23.auth.dto.UserRegistrationRequest
import java.util.UUID

@Service
@Profile("!standalone-auth")
class RemoteIdentityDirectory(
    private val userClient: UserClient,
    private val properties: AuthProperties,
) : IdentityDirectory {
    override fun create(request: UserRegistrationRequest) =
        userClient.createUser(properties.security.serviceToken, request)

    override fun find(userId: UUID) =
        userClient.getAuthContext(properties.security.serviceToken, userId)
}
