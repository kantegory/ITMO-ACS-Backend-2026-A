package ru.itmo.pxdkxvan.lab23.application.dto

import java.util.UUID

data class ResumeOwnershipResponse(
    val resumeId: UUID,
    val ownerUserId: UUID,
    val ownedByUser: Boolean,
    val status: String,
)
