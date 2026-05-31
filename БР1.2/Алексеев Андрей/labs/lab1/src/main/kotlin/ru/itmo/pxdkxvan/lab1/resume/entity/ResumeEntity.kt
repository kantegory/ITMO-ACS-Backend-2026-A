package ru.itmo.pxdkxvan.lab1.resume.entity

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
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity
import ru.itmo.pxdkxvan.lab1.user.entity.UserAccountEntity
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "resume")
class ResumeEntity {
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
    @JoinColumn(name = "user_id", nullable = false)
    lateinit var user: UserAccountEntity

    @Column(name = "title", nullable = false, length = 255)
    lateinit var title: String

    @Column(name = "desired_position", nullable = false, length = 255)
    lateinit var desiredPosition: String

    @Column(name = "about_me", nullable = false)
    lateinit var aboutMe: String

    @Column(name = "salary_expectation", precision = 12, scale = 2)
    var salaryExpectation: BigDecimal? = null

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
        name = "resume_skill",
        joinColumns = [JoinColumn(name = "resume_id")],
        inverseJoinColumns = [JoinColumn(name = "skill_id")],
    )
    val skills: MutableSet<SkillEntity> = linkedSetOf()

    @OneToMany(mappedBy = "resume", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val educations: MutableList<ResumeEducationEntity> = mutableListOf()

    @OneToMany(mappedBy = "resume", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val workExperiences: MutableList<ResumeWorkExperienceEntity> = mutableListOf()
}
