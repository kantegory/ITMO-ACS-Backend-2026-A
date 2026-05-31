package ru.itmo.pxdkxvan.lab23.vacancy.dto

import java.math.BigDecimal

data class VacancyRequest(
    val title: String,
    val description: String,
    val country: String,
    val city: String,
    val metro: String?,
    val salaryFrom: BigDecimal?,
    val salaryTo: BigDecimal?,
    val currency: String?,
    val industryCode: String,
    val experienceLevelCode: String,
    val employmentType: String,
    val workFormat: String,
    val educationLevel: String?,
    val skillCodes: List<String> = emptyList(),
    val status: String = "DRAFT",
    val acceptsApplications: Boolean = true,
)
