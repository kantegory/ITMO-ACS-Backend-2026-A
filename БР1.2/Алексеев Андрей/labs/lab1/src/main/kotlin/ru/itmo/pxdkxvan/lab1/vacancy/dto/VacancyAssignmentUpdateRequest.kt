package ru.itmo.pxdkxvan.lab1.vacancy.dto

import jakarta.validation.constraints.NotBlank

data class VacancyAssignmentUpdateRequest(
    @field:NotBlank
    val assignmentRole: String,
)
