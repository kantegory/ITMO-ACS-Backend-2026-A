package ru.itmo.pxdkxvan.lab1.resume.dto

import java.time.LocalDate
import java.util.UUID

data class ResumeWorkExperienceItemResponse(
    val id: UUID,
    val companyName: String,
    val position: String,
    val city: String?,
    val startDate: LocalDate,
    val endDate: LocalDate?,
    val isCurrent: Boolean,
    val description: String?,
)
