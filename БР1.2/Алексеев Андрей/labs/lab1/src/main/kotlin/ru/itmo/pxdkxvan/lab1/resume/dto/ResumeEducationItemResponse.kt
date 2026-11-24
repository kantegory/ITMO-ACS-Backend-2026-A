package ru.itmo.pxdkxvan.lab1.resume.dto

import java.time.LocalDate
import java.util.UUID

data class ResumeEducationItemResponse(
    val id: UUID,
    val institutionName: String,
    val degree: String,
    val specialization: String?,
    val startDate: LocalDate,
    val endDate: LocalDate?,
    val isCurrent: Boolean,
    val description: String?,
)
