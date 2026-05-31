package ru.itmo.pxdkxvan.lab23.user.service

import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.user.dto.AuthContextResponse
import ru.itmo.pxdkxvan.lab23.user.dto.NotificationContextResponse
import ru.itmo.pxdkxvan.lab23.user.dto.RoleAssignRequest
import ru.itmo.pxdkxvan.lab23.user.dto.RoleCreateRequest
import ru.itmo.pxdkxvan.lab23.user.dto.RoleResponse
import ru.itmo.pxdkxvan.lab23.user.dto.UserRegistrationRequest
import ru.itmo.pxdkxvan.lab23.user.dto.UserResponse
import ru.itmo.pxdkxvan.lab23.user.dto.UserUpdateRequest
import ru.itmo.pxdkxvan.lab23.user.entity.RoleEntity
import ru.itmo.pxdkxvan.lab23.user.entity.UserEntity
import ru.itmo.pxdkxvan.lab23.user.mapper.UserMapper
import ru.itmo.pxdkxvan.lab23.user.repository.RoleRepository
import ru.itmo.pxdkxvan.lab23.user.repository.UserRepository
import java.util.UUID

@Service
class UserService(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val userMapper: UserMapper,
) {
    @Transactional
    fun createInternal(serviceToken: String, expectedToken: String, request: UserRegistrationRequest): AuthContextResponse {
        require(serviceToken == expectedToken) { "Invalid service token" }
        check(!userRepository.existsByEmailIgnoreCase(request.email.trim().lowercase())) { "Email is already in use" }
        check(!userRepository.existsByPhone(request.phone.trim())) { "Phone is already in use" }

        val role = roleRepository.findByName(request.role.trim().uppercase()) ?: error("Role not configured")
        return userRepository.save(
            UserEntity(
                firstName = request.firstName.trim(),
                lastName = request.lastName.trim(),
                middleName = request.middleName?.trim()?.ifBlank { null },
                email = request.email.trim().lowercase(),
                phone = request.phone.trim(),
                roles = linkedSetOf(role),
            ),
        ).let(userMapper::toAuthContextResponse)
    }

    @Transactional(readOnly = true)
    fun me(jwt: Jwt): UserResponse = userMapper.toUserResponse(findUser(UUID.fromString(jwt.subject)))

    @Transactional
    fun update(jwt: Jwt, request: UserUpdateRequest): UserResponse {
        val user = findUser(UUID.fromString(jwt.subject))
        request.firstName?.let { user.firstName = it.trim() }
        request.lastName?.let { user.lastName = it.trim() }
        if (request.middleName != null) {
            user.middleName = request.middleName.trim().ifBlank { null }
        }
        request.email?.trim()?.lowercase()?.let {
            if (it != user.email) {
                check(!userRepository.existsByEmailIgnoreCase(it)) { "Email is already in use" }
                user.email = it
            }
        }
        request.phone?.trim()?.let {
            if (it != user.phone) {
                check(!userRepository.existsByPhone(it)) { "Phone is already in use" }
                user.phone = it
            }
        }
        return userMapper.toUserResponse(userRepository.save(user))
    }

    @Transactional(readOnly = true)
    fun listRoles(): Map<String, List<RoleResponse>> =
        mapOf("items" to roleRepository.findAll().sortedBy { it.name }.map(userMapper::toRoleResponse))

    @Transactional
    fun createRole(request: RoleCreateRequest): RoleResponse {
        val normalizedName = request.name.trim().uppercase().replace(Regex("[^A-Z0-9]+"), "_").trim('_')
        check(!roleRepository.existsByNameIgnoreCase(normalizedName)) { "Role already exists" }

        return roleRepository.save(
            RoleEntity(
                name = normalizedName,
                description = request.description?.trim()?.ifBlank { null },
            ),
        ).let(userMapper::toRoleResponse)
    }

    @Transactional
    fun assignRole(userId: UUID, request: RoleAssignRequest): UserResponse {
        val user = findUser(userId)
        user.roles.add(roleRepository.findById(request.roleId).orElseThrow())
        return userMapper.toUserResponse(userRepository.save(user))
    }

    @Transactional(readOnly = true)
    fun authContext(serviceToken: String, expectedToken: String, userId: UUID): AuthContextResponse {
        require(serviceToken == expectedToken) { "Invalid service token" }
        return userMapper.toAuthContextResponse(findUser(userId))
    }

    @Transactional(readOnly = true)
    fun notificationContext(serviceToken: String, expectedToken: String, userId: UUID): NotificationContextResponse {
        require(serviceToken == expectedToken) { "Invalid service token" }
        return userMapper.toNotificationContextResponse(findUser(userId))
    }

    private fun findUser(userId: UUID): UserEntity = userRepository.findById(userId).orElseThrow()
}
