package ru.itmo.pxdkxvan.lab1.vacancy.dto

import java.time.OffsetDateTime
import java.util.UUID

data class VacancyAssignmentResponse(
    val id: UUID,
    val employerProfileId: UUID,
    val vacancyId: UUID,
    val assignmentRole: String,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
    val version: Long,
)
