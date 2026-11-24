package ru.itmo.pxdkxvan.lab23.auth.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.auth.entity.CredentialEntity
import java.util.UUID

interface CredentialRepository : JpaRepository<CredentialEntity, UUID> {
    fun findByEmailIgnoreCase(email: String): CredentialEntity?

    fun existsByEmailIgnoreCase(email: String): Boolean

    fun findByRefreshToken(refreshToken: String): CredentialEntity?
}
