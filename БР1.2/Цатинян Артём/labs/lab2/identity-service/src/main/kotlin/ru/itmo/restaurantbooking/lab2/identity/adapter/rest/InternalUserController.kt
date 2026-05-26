package ru.itmo.restaurantbooking.lab2.identity.adapter.rest

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.UserSummaryResponse
import ru.itmo.restaurantbooking.lab2.identity.service.UserService

@RestController
@RequestMapping("/internal/v1/users")
class InternalUserController(
    private val userService: UserService
) {
    @GetMapping("/{userId}/summary")
    fun summary(@PathVariable userId: Long): UserSummaryResponse =
        userService.summary(userId)
}
