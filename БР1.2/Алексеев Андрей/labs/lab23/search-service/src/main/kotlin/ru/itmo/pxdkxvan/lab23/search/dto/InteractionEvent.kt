package ru.itmo.pxdkxvan.lab23.search.dto

import java.time.OffsetDateTime
import java.util.UUID

data class InteractionEvent(
    val eventType: String,
    val userId: UUID,
    val vacancyId: UUID,
    val occurredAt: OffsetDateTime,
)
