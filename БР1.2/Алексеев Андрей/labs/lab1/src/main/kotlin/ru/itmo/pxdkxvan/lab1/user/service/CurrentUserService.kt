package ru.itmo.pxdkxvan.lab1.user.service

import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import ru.itmo.pxdkxvan.lab1.user.entity.UserAccountEntity
import ru.itmo.pxdkxvan.lab1.user.repository.UserAccountRepository
import java.util.UUID

@Service
class CurrentUserService(
    private val userAccountRepository: UserAccountRepository,
) {
    fun currentUser(jwt: Jwt): UserAccountEntity =
        userAccountRepository.findById(UUID.fromString(jwt.subject)).orElseThrow {
            ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHORIZED, "Authentication required")
        }

    fun currentUserWithRole(jwt: Jwt, vararg roles: SystemRole): UserAccountEntity {
        val user = currentUser(jwt)
        if (roles.isNotEmpty() && roles.none { user.hasRole(it) }) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Current user role is not allowed")
        }
        return user
    }

    fun currentUserWithAnyRole(jwt: Jwt, roles: Set<SystemRole>): UserAccountEntity {
        val user = currentUser(jwt)
        if (!user.hasAnyRole(roles)) {
            throw ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Current user role is not allowed")
        }
        return user
    }

    private fun UserAccountEntity.hasRole(role: SystemRole): Boolean =
        roles.any { it.name == role.name }

    private fun UserAccountEntity.hasAnyRole(roles: Set<SystemRole>): Boolean =
        roles.any { role -> roles.any { it.name == role.name } }
}
