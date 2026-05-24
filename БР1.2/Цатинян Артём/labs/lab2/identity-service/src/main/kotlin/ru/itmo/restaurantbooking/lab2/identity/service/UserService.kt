package ru.itmo.restaurantbooking.lab2.identity.service

import org.springframework.stereotype.Service
import ru.itmo.restaurantbooking.lab2.common.exception.NotFoundException
import ru.itmo.restaurantbooking.lab2.identity.adapter.jdbc.UserRepository
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UpdateProfileRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UserProfileResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UserSummaryResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.toProfile
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.toSummary

@Service
class UserService(
    private val userRepository: UserRepository
) {
    fun profile(userId: Long): UserProfileResponse =
        (userRepository.findById(userId) ?: throw NotFoundException("User not found")).toProfile()

    fun updateProfile(userId: Long, request: UpdateProfileRequest): UserProfileResponse =
        userRepository.update(userId, request).toProfile()

    fun summary(userId: Long): UserSummaryResponse =
        (userRepository.findById(userId) ?: throw NotFoundException("User not found")).toSummary()
}
