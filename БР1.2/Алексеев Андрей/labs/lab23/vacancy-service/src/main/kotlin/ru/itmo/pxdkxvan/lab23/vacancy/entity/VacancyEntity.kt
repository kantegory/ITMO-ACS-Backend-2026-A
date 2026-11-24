package ru.itmo.pxdkxvan.lab23.vacancy.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "vacancies")
class VacancyEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false)
    var companyId: UUID? = null,
    @Column(nullable = false)
    var createdByUserId: UUID? = null,
    @Column(nullable = false)
    var title: String = "",
    @Column(nullable = false, length = 4000)
    var description: String = "",
    @Column(nullable = false)
    var country: String = "",
    @Column(nullable = false)
    var city: String = "",
    var metro: String? = null,
    var salaryFrom: BigDecimal? = null,
    var salaryTo: BigDecimal? = null,
    var currency: String? = null,
    @Column(nullable = false)
    var industryCode: String = "",
    @Column(nullable = false)
    var experienceLevelCode: String = "",
    @Column(nullable = false)
    var employmentType: String = "",
    @Column(nullable = false)
    var workFormat: String = "",
    var educationLevel: String? = null,
    var companyName: String? = null,
    @Column(nullable = false)
    var status: String = "DRAFT",
    var publishedAt: OffsetDateTime? = null,
    @Column(nullable = false)
    var acceptsApplications: Boolean = true,
    @Column(nullable = false)
    var skillsCsv: String = "",
)
