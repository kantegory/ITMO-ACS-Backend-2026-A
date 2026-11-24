package ru.itmo.pxdkxvan.lab1.vacancy.dto

import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID
import ru.itmo.pxdkxvan.lab1.dictionary.dto.SkillSummaryResponse

data class VacancyResponse(
    val id: UUID,
    val vacancyAssignmentId: UUID?,
    val companyId: UUID,
    val industryId: UUID,
    val experienceLevelId: UUID,
    val title: String,
    val description: String,
    val salaryFrom: BigDecimal?,
    val salaryTo: BigDecimal?,
    val city: String,
    val employmentType: String,
    val workFormat: String,
    val status: String,
    val skills: List<SkillSummaryResponse>,
    val requirements: List<OrderedTextItemResponse>,
    val responsibilities: List<OrderedTextItemResponse>,
    val benefits: List<OrderedTextItemResponse>,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)
