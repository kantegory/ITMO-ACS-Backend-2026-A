package ru.itmo.pxdkxvan.lab1.resume.dto

import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillSummaryResponse

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
    val skills: List<SkillSummaryResponse>,
    val educations: List<ResumeEducationItemResponse>,
    val workExperiences: List<ResumeWorkExperienceItemResponse>,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)
