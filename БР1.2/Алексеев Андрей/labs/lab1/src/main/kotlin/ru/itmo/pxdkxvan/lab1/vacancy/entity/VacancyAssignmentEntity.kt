package ru.itmo.pxdkxvan.lab1.vacancy.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.Version
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.hibernate.annotations.UuidGenerator
import ru.itmo.pxdkxvan.lab1.company.entity.EmployerProfileEntity
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "vacancy_assignment")
class VacancyAssignmentEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    var id: UUID? = null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime? = null

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime? = null

    @Version
    @Column(name = "version", nullable = false)
    var version: Long = 0

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_profile_id", nullable = false)
    lateinit var employerProfile: EmployerProfileEntity

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacancy_id", nullable = false)
    lateinit var vacancy: VacancyEntity

    @Column(name = "assignment_role", nullable = false, length = 30)
    lateinit var assignmentRole: String
}
