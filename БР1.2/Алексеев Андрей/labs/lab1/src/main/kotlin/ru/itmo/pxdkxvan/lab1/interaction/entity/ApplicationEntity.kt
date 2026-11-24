package ru.itmo.pxdkxvan.lab1.interaction.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UuidGenerator
import ru.itmo.pxdkxvan.lab1.resume.entity.ResumeEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyEntity
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "application")
class ApplicationEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    var id: UUID? = null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    lateinit var resume: ResumeEntity

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacancy_id", nullable = false)
    lateinit var vacancy: VacancyEntity

    @Column(name = "cover_letter")
    var coverLetter: String? = null

    @Column(name = "status", nullable = false, length = 20)
    lateinit var status: String

    @Column(name = "status_changed_at", nullable = false)
    var statusChangedAt: OffsetDateTime = OffsetDateTime.now()
}
