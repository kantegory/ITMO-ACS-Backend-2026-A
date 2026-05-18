package ru.itmo.pxdkxvan.lab1.vacancy.entity

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.hibernate.annotations.UuidGenerator
import ru.itmo.pxdkxvan.lab1.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "vacancy")
class VacancyEntity {
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacancy_assignment_id")
    var primaryAssignment: VacancyAssignmentEntity? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    lateinit var company: CompanyEntity

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_id", nullable = false)
    lateinit var industry: IndustryEntity

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_level_id", nullable = false)
    lateinit var experienceLevel: ExperienceLevelEntity

    @Column(name = "title", nullable = false, length = 255)
    lateinit var title: String

    @Column(name = "description", nullable = false)
    lateinit var description: String

    @Column(name = "salary_from", precision = 12, scale = 2)
    var salaryFrom: BigDecimal? = null

    @Column(name = "salary_to", precision = 12, scale = 2)
    var salaryTo: BigDecimal? = null

    @Column(name = "city", nullable = false, length = 255)
    lateinit var city: String

    @Column(name = "employment_type", nullable = false, length = 20)
    lateinit var employmentType: String

    @Column(name = "work_format", nullable = false, length = 20)
    lateinit var workFormat: String

    @Column(name = "status", nullable = false, length = 20)
    lateinit var status: String

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "vacancy_skill",
        joinColumns = [JoinColumn(name = "vacancy_id")],
        inverseJoinColumns = [JoinColumn(name = "skill_id")],
    )
    val skills: MutableSet<SkillEntity> = linkedSetOf()

    @OneToMany(mappedBy = "vacancy", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val requirements: MutableList<VacancyRequirementEntity> = mutableListOf()

    @OneToMany(mappedBy = "vacancy", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val responsibilities: MutableList<VacancyResponsibilityEntity> = mutableListOf()

    @OneToMany(mappedBy = "vacancy", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val benefits: MutableList<VacancyBenefitEntity> = mutableListOf()

    @OneToMany(mappedBy = "vacancy", fetch = FetchType.LAZY)
    val assignments: MutableList<VacancyAssignmentEntity> = mutableListOf()
}
