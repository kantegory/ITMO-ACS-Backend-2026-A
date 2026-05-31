package ru.itmo.pxdkxvan.lab23.resume.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.resume.entity.ResumeEntity
import java.util.UUID

interface ResumeRepository : JpaRepository<ResumeEntity, UUID> {
    fun findAllByUserId(userId: UUID, pageable: org.springframework.data.domain.Pageable): org.springframework.data.domain.Page<ResumeEntity>
}
