package ru.itmo.pxdkxvan.lab23.company.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.company.entity.EmployerProfileEntity
import java.util.UUID

interface EmployerProfileRepository : JpaRepository<EmployerProfileEntity, UUID> {
    fun findByUserId(userId: UUID): EmployerProfileEntity?
}
