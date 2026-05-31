package ru.itmo.pxdkxvan.lab1.resume.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class ResumeWorkExperienceItemRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val companyName: String,
    @field:NotBlank
    @field:Size(max = 255)
    val position: String,
    @field:Size(max = 255)
    val city: String? = null,
    val startDate: LocalDate,
    val endDate: LocalDate? = null,
    val isCurrent: Boolean = false,
    val description: String? = null,
)
