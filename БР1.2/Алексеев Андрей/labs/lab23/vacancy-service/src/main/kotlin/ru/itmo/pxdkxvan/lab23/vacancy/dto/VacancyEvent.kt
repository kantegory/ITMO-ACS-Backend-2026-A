package ru.itmo.pxdkxvan.lab23.vacancy.dto

import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

data class VacancyEvent(
    val eventType: String,
    val vacancyId: UUID,
    val title: String?,
    val description: String?,
    val companyId: UUID?,
    val companyName: String?,
    val country: String?,
    val city: String?,
    val metro: String?,
    val salaryFrom: BigDecimal?,
    val salaryTo: BigDecimal?,
    val currency: String?,
    val industryCode: String?,
    val experienceLevelCode: String?,
    val employmentType: String?,
    val workFormat: String?,
    val educationLevel: String?,
    val status: String?,
    val publishedAt: OffsetDateTime?,
    val skillCodes: List<String>,
)
