package ru.itmo.pxdkxvan.lab23.user.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.user.entity.RoleEntity
import java.util.UUID

interface RoleRepository : JpaRepository<RoleEntity, UUID> {
    fun findByName(name: String): RoleEntity?

    fun existsByNameIgnoreCase(name: String): Boolean
}
