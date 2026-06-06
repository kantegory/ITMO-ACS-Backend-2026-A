package ru.itmo.restaurantbooking.user.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import ru.itmo.restaurantbooking.jooq.tables.pojos.Users
import ru.itmo.restaurantbooking.user.adapter.jdbc.UserDao
import ru.itmo.restaurantbooking.user.domain.UserRole
import java.time.LocalDateTime

@Component
class DefaultAdminInitializer(
    private val userDao: UserDao,
    private val passwordEncoder: PasswordEncoder
) {
    init {
        if (!userDao.hasAnyAdmin()) {
            val admin = Users()
                .setEmail("admin@restaurant-booking.local")
                .setPasswordHash(passwordEncoder.encode("storageAdmin123"))
                .setFirstName("System")
                .setLastName("Administrator")
                .setPhone("+79990000001")
                .setRole(UserRole.ADMIN)
                .setIsActive(true)
                .setCreatedAt(LocalDateTime.now())
            userDao.insertReturning(admin)
        }
    }
}
