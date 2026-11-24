package ru.itmo.pxdkxvan.lab1.resume.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

data class ResumeCreateRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    @field:NotBlank
    @field:Size(max = 255)
    val desiredPosition: String,
    @field:NotBlank
    val aboutMe: String,
    @field:DecimalMin("0.0")
    val salaryExpectation: BigDecimal? = null,
    @field:NotBlank
    @field:Size(max = 255)
    val city: String,
    @field:NotBlank
    val employmentType: String,
    @field:NotBlank
    val workFormat: String,
    @field:NotBlank
    val status: String,
    val skillIds: List<UUID> = emptyList(),
    val educations: List<ResumeEducationItemRequest> = emptyList(),
    val workExperiences: List<ResumeWorkExperienceItemRequest> = emptyList(),
)
