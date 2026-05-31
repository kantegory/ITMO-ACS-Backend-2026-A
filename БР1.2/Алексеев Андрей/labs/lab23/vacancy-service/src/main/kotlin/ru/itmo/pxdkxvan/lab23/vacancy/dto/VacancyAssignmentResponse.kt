package ru.itmo.pxdkxvan.lab23.vacancy.dto

import java.util.UUID

data class VacancyAssignmentResponse(
    val id: UUID,
    val vacancyId: UUID,
    val employerProfileId: UUID,
    val employerUserId: UUID,
    val assignmentRole: String,
)
