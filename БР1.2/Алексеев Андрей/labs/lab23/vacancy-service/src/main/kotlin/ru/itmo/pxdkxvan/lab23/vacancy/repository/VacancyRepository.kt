package ru.itmo.pxdkxvan.lab23.vacancy.repository

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyEntity
import java.util.UUID

interface VacancyRepository : JpaRepository<VacancyEntity, UUID> {
    fun findAllByCreatedByUserId(createdByUserId: UUID, pageable: Pageable): org.springframework.data.domain.Page<VacancyEntity>
}
