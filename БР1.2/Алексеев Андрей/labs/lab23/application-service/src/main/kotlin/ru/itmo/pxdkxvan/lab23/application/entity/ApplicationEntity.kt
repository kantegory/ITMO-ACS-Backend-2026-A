package ru.itmo.pxdkxvan.lab23.application.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "applications")
class ApplicationEntity(
    @Id @GeneratedValue var id: UUID? = null,
    @Column(nullable = false) var vacancyId: UUID? = null,
    @Column(nullable = false) var resumeId: UUID? = null,
    @Column(nullable = false) var applicantUserId: UUID? = null,
    @Column(nullable = false) var status: String = "PENDING",
    var coverLetter: String? = null,
    @Column(nullable = false) var createdAt: OffsetDateTime = OffsetDateTime.now(),
    @Column(nullable = false) var statusChangedAt: OffsetDateTime = OffsetDateTime.now(),
)
