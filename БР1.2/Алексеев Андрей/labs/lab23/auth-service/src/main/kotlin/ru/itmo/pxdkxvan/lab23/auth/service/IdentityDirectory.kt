package ru.itmo.pxdkxvan.lab23.auth.service

import ru.itmo.pxdkxvan.lab23.auth.dto.AuthContextResponse
import ru.itmo.pxdkxvan.lab23.auth.dto.UserRegistrationRequest
import java.util.UUID

interface IdentityDirectory {
    fun create(request: UserRegistrationRequest): AuthContextResponse
    fun find(userId: UUID): AuthContextResponse
}
