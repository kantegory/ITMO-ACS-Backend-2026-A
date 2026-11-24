package ru.itmo.pxdkxvan.lab23.user.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.user.entity.UserEntity
import java.util.UUID

interface UserRepository : JpaRepository<UserEntity, UUID> {
    fun existsByEmailIgnoreCase(email: String): Boolean

    fun existsByPhone(phone: String): Boolean
}
