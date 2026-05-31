package ru.itmo.pxdkxvan.lab23.company.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab23.company.dto.CompanyEvent
import ru.itmo.pxdkxvan.lab23.company.entity.CompanyEntity
import java.time.OffsetDateTime

@Service
class CompanyEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper,
) {
    fun publish(eventType: String, company: CompanyEntity) {
        kafkaTemplate.send(
            "company.events",
            company.id.toString(),
            objectMapper.writeValueAsString(
                CompanyEvent(
                    eventType = eventType,
                    companyId = company.id!!,
                    title = company.title,
                    occurredAt = OffsetDateTime.now(),
                ),
            ),
        )
    }
}
