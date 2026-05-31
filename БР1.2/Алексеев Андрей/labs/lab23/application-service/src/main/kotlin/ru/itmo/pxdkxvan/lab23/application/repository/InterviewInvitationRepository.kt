package ru.itmo.pxdkxvan.lab23.application.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.application.entity.InterviewInvitationEntity
import java.util.UUID

interface InterviewInvitationRepository : JpaRepository<InterviewInvitationEntity, UUID>
