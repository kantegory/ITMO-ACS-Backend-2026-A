package ru.itmo.pxdkxvan.lab23.vacancy.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyAssignmentEntity
import java.util.UUID

interface VacancyAssignmentRepository : JpaRepository<VacancyAssignmentEntity, UUID> {
    fun findAllByVacancyId(vacancyId: UUID): List<VacancyAssignmentEntity>
}
