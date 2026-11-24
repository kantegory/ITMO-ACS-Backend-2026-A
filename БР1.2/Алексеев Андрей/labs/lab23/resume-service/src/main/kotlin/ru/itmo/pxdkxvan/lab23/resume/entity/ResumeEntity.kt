package ru.itmo.pxdkxvan.lab23.resume.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.util.UUID

@Entity
@Table(name = "resumes")
class ResumeEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false)
    var userId: UUID? = null,
    @Column(nullable = false)
    var title: String = "",
    @Column(nullable = false)
    var desiredPosition: String = "",
    @Column(nullable = false, length = 4000)
    var aboutMe: String = "",
    var salaryExpectation: BigDecimal? = null,
    @Column(nullable = false)
    var city: String = "",
    @Column(nullable = false)
    var employmentType: String = "",
    @Column(nullable = false)
    var workFormat: String = "",
    @Column(nullable = false)
    var status: String = "",
    var educationLevel: String? = null,
    var experienceLevelCode: String? = null,
    var skillsCsv: String = "",
)
