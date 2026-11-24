package ru.itmo.pxdkxvan.lab23.vacancy.dto

import java.util.UUID

data class VacancyAssignmentRequest(
    val employerProfileId: UUID,
    val assignmentRole: String,
)
