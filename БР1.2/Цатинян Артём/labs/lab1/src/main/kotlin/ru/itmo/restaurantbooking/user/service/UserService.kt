package ru.itmo.restaurantbooking.user.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.common.exception.NotFoundException
import ru.itmo.restaurantbooking.user.adapter.jdbc.UserDao
import ru.itmo.restaurantbooking.user.adapter.rest.dto.UpdateProfileRequest
import ru.itmo.restaurantbooking.user.adapter.rest.dto.UserProfileResponse
import ru.itmo.restaurantbooking.user.adapter.rest.mapper.UserRestMapper

@Service
class UserService(
    private val userDao: UserDao,
    private val userRestMapper: UserRestMapper
) {

    fun getCurrentUser(userId: Long): UserProfileResponse {
        val user = userDao.findActiveById(userId) ?: throw NotFoundException("User not found")
        return userRestMapper.toResponse(user)
    }

    fun updateCurrentUser(userId: Long, request: UpdateProfileRequest): UserProfileResponse {
        val user = userDao.findActiveById(userId) ?: throw NotFoundException("User not found")
        request.firstName?.takeIf { it.isNotBlank() }?.let { user.firstName = it.trim() }
        request.lastName?.takeIf { it.isNotBlank() }?.let { user.lastName = it.trim() }
        request.phone?.takeIf { it.isNotBlank() }?.let { user.phone = it.trim() }
        userDao.update(user)
        return userRestMapper.toResponse(user)
    }
}
