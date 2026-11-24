package ru.itmo.pxdkxvan.lab23.vacancy.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "vacancy_assignments")
class VacancyAssignmentEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false)
    var vacancyId: UUID? = null,
    @Column(nullable = false)
    var employerProfileId: UUID? = null,
    @Column(nullable = false)
    var employerUserId: UUID? = null,
    @Column(nullable = false)
    var assignmentRole: String = "PRIMARY",
)
