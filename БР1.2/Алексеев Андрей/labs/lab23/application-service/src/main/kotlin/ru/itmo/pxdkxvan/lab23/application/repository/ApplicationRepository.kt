package ru.itmo.pxdkxvan.lab23.application.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.application.entity.ApplicationEntity
import java.util.UUID

interface ApplicationRepository : JpaRepository<ApplicationEntity, UUID> {
    fun existsByVacancyIdAndResumeId(vacancyId: UUID, resumeId: UUID): Boolean
    fun findAllByApplicantUserId(applicantUserId: UUID, pageable: Pageable): Page<ApplicationEntity>
    fun findAllByVacancyId(vacancyId: UUID, pageable: Pageable): Page<ApplicationEntity>
}
