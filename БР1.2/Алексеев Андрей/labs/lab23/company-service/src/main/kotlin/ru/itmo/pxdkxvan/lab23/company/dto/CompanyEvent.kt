package ru.itmo.pxdkxvan.lab23.company.dto

import java.time.OffsetDateTime
import java.util.UUID

data class CompanyEvent(
    val eventType: String,
    val companyId: UUID,
    val title: String,
    val occurredAt: OffsetDateTime,
)
