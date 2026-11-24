package ru.itmo.pxdkxvan.lab1.role.service

import org.springframework.http.HttpStatus
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab1.common.ApiErrorCode
import ru.itmo.pxdkxvan.lab1.common.ApiException
import ru.itmo.pxdkxvan.lab1.common.ItemsResponse
import ru.itmo.pxdkxvan.lab1.common.SystemRole
import ru.itmo.pxdkxvan.lab1.common.requireCondition
import ru.itmo.pxdkxvan.lab1.role.dto.RoleAssignRequest
import ru.itmo.pxdkxvan.lab1.role.dto.RoleCreateRequest
import ru.itmo.pxdkxvan.lab1.role.dto.RoleResponse
import ru.itmo.pxdkxvan.lab1.user.dto.UserResponse
import ru.itmo.pxdkxvan.lab1.role.mapper.RoleMapper
import ru.itmo.pxdkxvan.lab1.role.repository.RoleRepository
import ru.itmo.pxdkxvan.lab1.user.mapper.UserMapper
import ru.itmo.pxdkxvan.lab1.user.repository.UserAccountRepository
import ru.itmo.pxdkxvan.lab1.user.service.CurrentUserService
import java.util.UUID

@Service
class RoleService(
    private val currentUserService: CurrentUserService,
    private val roleRepository: RoleRepository,
    private val userAccountRepository: UserAccountRepository,
    private val roleMapper: RoleMapper,
    private val userMapper: UserMapper,
) {
    @Transactional(readOnly = true)
    fun listRoles(jwt: Jwt): ItemsResponse<RoleResponse> {
        currentUserService.currentUserWithRole(jwt, SystemRole.ADMIN)
        return ItemsResponse(roleRepository.findAll().sortedBy { it.name }.map(roleMapper::toRoleResponse))
    }

    @Transactional
    fun createRole(jwt: Jwt, request: RoleCreateRequest): RoleResponse {
        currentUserService.currentUserWithRole(jwt, SystemRole.ADMIN)
        val normalizedName = normalizeRoleName(request.name)
        if (roleRepository.existsByNameIgnoreCase(normalizedName)) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Role name is already in use")
        }

        val role = roleMapper.fromRawData(
            name = normalizedName,
            description = request.description?.trim()?.ifBlank { null },
            isSystem = request.isSystem,
        )

        val saved = roleRepository.saveAndFlush(role)
        return roleMapper.toRoleResponse(
            roleRepository.findById(saved.id!!).orElseThrow {
                ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL, "Role was not found after creation")
            },
        )
    }

    @Transactional
    fun addRoleToUser(jwt: Jwt, userId: UUID, request: RoleAssignRequest): UserResponse {
        currentUserService.currentUserWithRole(jwt, SystemRole.ADMIN)
        val user = userAccountRepository.findById(userId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "User not found")
        }
        val role = roleRepository.findById(request.roleId).orElseThrow {
            ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.NOT_FOUND, "Role not found")
        }

        if (user.roles.any { it.id == role.id }) {
            throw ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Role is already assigned to user")
        }

        user.roles.add(role)
        return userMapper.toUserResponse(userAccountRepository.save(user))
    }

    private fun normalizeRoleName(raw: String): String {
        val normalized = raw.trim().uppercase()
            .replace(Regex("[^A-Z0-9]+"), "_")
            .trim('_')
        requireCondition(normalized.isNotBlank(), "name must not be blank", "name")
        return normalized
    }
}
