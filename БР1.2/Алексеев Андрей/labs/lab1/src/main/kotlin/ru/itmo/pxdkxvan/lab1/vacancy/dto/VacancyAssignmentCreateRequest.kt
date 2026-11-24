package ru.itmo.pxdkxvan.lab1.vacancy.dto

import jakarta.validation.constraints.NotBlank
import java.util.UUID

data class VacancyAssignmentCreateRequest(
    val employerProfileId: UUID,
    @field:NotBlank
    val assignmentRole: String,
)
