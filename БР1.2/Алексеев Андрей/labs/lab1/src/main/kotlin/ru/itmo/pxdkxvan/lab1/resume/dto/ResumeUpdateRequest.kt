package ru.itmo.pxdkxvan.lab1.resume.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.util.UUID

data class ResumeUpdateRequest(
    @field:Size(max = 255)
    val title: String? = null,
    @field:Size(max = 255)
    val desiredPosition: String? = null,
    val aboutMe: String? = null,
    @field:DecimalMin("0.0")
    val salaryExpectation: BigDecimal? = null,
    @field:Size(max = 255)
    val city: String? = null,
    val employmentType: String? = null,
    val workFormat: String? = null,
    val status: String? = null,
    val skillIds: List<UUID>? = null,
    val educations: List<ResumeEducationItemRequest>? = null,
    val workExperiences: List<ResumeWorkExperienceItemRequest>? = null,
)
