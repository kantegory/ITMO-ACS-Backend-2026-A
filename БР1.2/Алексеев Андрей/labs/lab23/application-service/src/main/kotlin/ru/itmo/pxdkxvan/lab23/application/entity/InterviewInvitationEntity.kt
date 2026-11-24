package ru.itmo.pxdkxvan.lab23.application.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "interview_invitations")
class InterviewInvitationEntity(
    @Id @GeneratedValue var id: UUID? = null,
    @Column(nullable = false) var applicationId: UUID? = null,
    @Column(nullable = false) var scheduledAt: OffsetDateTime = OffsetDateTime.now(),
    @Column(nullable = false) var format: String = "ONLINE",
    var notes: String? = null,
    @Column(nullable = false) var createdAt: OffsetDateTime = OffsetDateTime.now(),
)
