package ru.itmo.pxdkxvan.lab23.interaction.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Service
import ru.itmo.pxdkxvan.lab23.interaction.dto.InteractionEvent
import java.time.OffsetDateTime
import java.util.UUID

@Service
class InteractionEventPublisher(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper,
) {
    fun publish(eventType: String, userId: UUID, vacancyId: UUID) {
        kafkaTemplate.send(
            "interaction.events",
            vacancyId.toString(),
            objectMapper.writeValueAsString(InteractionEvent(eventType, userId, vacancyId, OffsetDateTime.now())),
        )
    }
}
