package ru.itmo.pxdkxvan.lab23.vacancy.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyEvent
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyEntity
import java.util.UUID

@Service
class VacancyEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper,
) {
    fun publish(eventType: String, vacancy: VacancyEntity) {
        kafkaTemplate.send(
            "vacancy.events",
            vacancy.id.toString(),
            objectMapper.writeValueAsString(
                VacancyEvent(
                    eventType = eventType,
                    vacancyId = vacancy.id!!,
                    title = vacancy.title,
                    description = vacancy.description,
                    companyId = vacancy.companyId,
                    companyName = vacancy.companyName,
                    country = vacancy.country,
                    city = vacancy.city,
                    metro = vacancy.metro,
                    salaryFrom = vacancy.salaryFrom,
                    salaryTo = vacancy.salaryTo,
                    currency = vacancy.currency,
                    industryCode = vacancy.industryCode,
                    experienceLevelCode = vacancy.experienceLevelCode,
                    employmentType = vacancy.employmentType,
                    workFormat = vacancy.workFormat,
                    educationLevel = vacancy.educationLevel,
                    status = vacancy.status,
                    publishedAt = vacancy.publishedAt,
                    skillCodes = vacancy.skillsCsv.split(",").filter { it.isNotBlank() },
                ),
            ),
        )
    }

    fun publishDeleted(vacancyId: UUID) {
        kafkaTemplate.send(
            "vacancy.events",
            vacancyId.toString(),
            objectMapper.writeValueAsString(
                VacancyEvent(
                    eventType = "VacancyDeleted",
                    vacancyId = vacancyId,
                    title = null,
                    description = null,
                    companyId = null,
                    companyName = null,
                    country = null,
                    city = null,
                    metro = null,
                    salaryFrom = null,
                    salaryTo = null,
                    currency = null,
                    industryCode = null,
                    experienceLevelCode = null,
                    employmentType = null,
                    workFormat = null,
                    educationLevel = null,
                    status = null,
                    publishedAt = null,
                    skillCodes = emptyList(),
                ),
            ),
        )
    }
}
