package ru.itmo.pxdkxvan.lab23.resume.dto

import java.math.BigDecimal
import java.util.UUID

data class ResumeResponse(
    val id: UUID,
    val userId: UUID,
    val title: String,
    val desiredPosition: String,
    val aboutMe: String,
    val salaryExpectation: BigDecimal?,
    val city: String,
    val employmentType: String,
    val workFormat: String,
    val status: String,
    val educationLevel: String?,
    val experienceLevelCode: String?,
    val skillCodes: List<String>,
)
