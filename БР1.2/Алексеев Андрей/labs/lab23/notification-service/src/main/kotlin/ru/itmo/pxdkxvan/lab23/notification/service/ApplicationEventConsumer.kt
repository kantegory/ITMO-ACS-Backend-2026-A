package ru.itmo.pxdkxvan.lab23.notification.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.notification.dto.ApplicationEvent
import ru.itmo.pxdkxvan.lab23.notification.entity.NotificationEntity
import ru.itmo.pxdkxvan.lab23.notification.repository.NotificationRepository

@Service
class ApplicationEventConsumer(
    private val objectMapper: ObjectMapper,
    private val notificationRepository: NotificationRepository,
) {
    @KafkaListener(topics = ["application.events"], groupId = "notification-service")
    @Transactional
    fun onApplicationEvent(message: String) {
        val event = objectMapper.readValue(message, ApplicationEvent::class.java)
        val body = when (event.eventType) {
            "ApplicationCreated" -> "Создан отклик на вакансию ${event.vacancyTitle ?: event.vacancyId}"
            "ApplicationStatusChanged" -> "Статус отклика по вакансии ${event.vacancyTitle ?: event.vacancyId} изменён на ${event.status}"
            "InterviewInvitationCreated" -> "Создано приглашение на собеседование по вакансии ${event.vacancyTitle ?: event.vacancyId}"
            else -> return
        }

        notificationRepository.save(
            NotificationEntity(
                userId = event.applicantUserId,
                type = event.eventType,
                title = "Событие по отклику",
                body = body,
            ),
        )
    }
}
