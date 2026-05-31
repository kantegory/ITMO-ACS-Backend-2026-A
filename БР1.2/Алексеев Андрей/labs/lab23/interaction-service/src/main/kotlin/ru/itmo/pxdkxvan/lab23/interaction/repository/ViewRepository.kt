package ru.itmo.pxdkxvan.lab23.interaction.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.interaction.entity.VacancyViewEntity
import java.util.UUID

interface ViewRepository : JpaRepository<VacancyViewEntity, UUID> {
    fun findAllByUserId(userId: UUID, pageable: org.springframework.data.domain.Pageable): org.springframework.data.domain.Page<VacancyViewEntity>
}
