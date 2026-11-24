package ru.itmo.pxdkxvan.lab1.resume.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.UuidGenerator
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "resume_work_experience")
class ResumeWorkExperienceEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    var id: UUID? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    lateinit var resume: ResumeEntity

    @Column(name = "company_name", nullable = false, length = 255)
    lateinit var companyName: String

    @Column(name = "position", nullable = false, length = 255)
    lateinit var position: String

    @Column(name = "city", length = 255)
    var city: String? = null

    @Column(name = "start_date", nullable = false)
    lateinit var startDate: LocalDate

    @Column(name = "end_date")
    var endDate: LocalDate? = null

    @Column(name = "is_current", nullable = false)
    var isCurrent: Boolean = false

    @Column(name = "description")
    var description: String? = null

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 1
}
