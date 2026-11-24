package ru.itmo.pxdkxvan.lab23.search.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.search.dto.InteractionEvent
import ru.itmo.pxdkxvan.lab23.search.dto.VacancyEvent
import ru.itmo.pxdkxvan.lab23.search.entity.VacancyDocument
import ru.itmo.pxdkxvan.lab23.search.repository.VacancyDocumentRepository

@Service
class SearchProjectionService(
    private val repository: VacancyDocumentRepository,
    private val objectMapper: ObjectMapper,
) {
    @KafkaListener(topics = ["vacancy.events"], groupId = "search-service")
    @Transactional
    fun handleVacancyEvent(message: String) {
        val event = objectMapper.readValue(message, VacancyEvent::class.java)
        if (event.eventType == "VacancyDeleted") {
            repository.deleteById(event.vacancyId.toString())
            return
        }
        val document = repository.findById(event.vacancyId.toString()).orElse(VacancyDocument(vacancyId = event.vacancyId.toString()))
        document.title = event.title.orEmpty()
        document.description = event.description.orEmpty()
        document.companyId = event.companyId?.toString()
        document.companyName = event.companyName
        document.country = event.country
        document.city = event.city
        document.metro = event.metro
        document.salaryFrom = event.salaryFrom
        document.salaryTo = event.salaryTo
        document.currency = event.currency
        document.industryCode = event.industryCode
        document.experienceLevelCode = event.experienceLevelCode
        document.employmentType = event.employmentType
        document.workFormat = event.workFormat
        document.educationLevel = event.educationLevel
        document.status = event.status
        document.publishedAt = event.publishedAt
        document.skillsCsv = event.skillCodes.joinToString(",")
        repository.save(document)
    }

    @KafkaListener(topics = ["interaction.events"], groupId = "search-service")
    @Transactional
    fun handleInteractionEvent(message: String) {
        val event = objectMapper.readValue(message, InteractionEvent::class.java)
        val document = repository.findById(event.vacancyId.toString()).orElse(null) ?: return
        when (event.eventType) {
            "VacancyViewed" -> document.viewCount += 1
            "VacancyAddedToFavorites" -> document.favoriteCount += 1
        }
        repository.save(document)
    }
}
