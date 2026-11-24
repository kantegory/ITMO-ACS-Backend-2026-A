package ru.itmo.pxdkxvan.lab23.notification.service

import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.notification.dto.Meta
import ru.itmo.pxdkxvan.lab23.notification.dto.NotificationResponse
import ru.itmo.pxdkxvan.lab23.notification.dto.PageResponse
import ru.itmo.pxdkxvan.lab23.notification.dto.ReadAllResponse
import ru.itmo.pxdkxvan.lab23.notification.entity.NotificationEntity
import ru.itmo.pxdkxvan.lab23.notification.mapper.NotificationMapper
import ru.itmo.pxdkxvan.lab23.notification.repository.NotificationRepository
import java.time.OffsetDateTime
import java.util.UUID

@Service
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val notificationMapper: NotificationMapper,
) {
    @Transactional(readOnly = true)
    fun my(jwt: Jwt, page: Int, limit: Int): PageResponse<NotificationResponse> {
        val result = notificationRepository.findAllByUserId(
            UUID.fromString(jwt.subject),
            PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt")),
        )
        return PageResponse(result.content.map(notificationMapper::toNotificationResponse), Meta(page, limit, result.totalElements))
    }

    @Transactional
    fun markRead(jwt: Jwt, id: UUID): NotificationResponse {
        val notification = notificationRepository.findById(id).orElseThrow()
        require(notification.userId == UUID.fromString(jwt.subject)) { "Access denied" }
        notification.readAt = OffsetDateTime.now()
        return notificationRepository.save(notification).let(notificationMapper::toNotificationResponse)
    }

    @Transactional
    fun markAllRead(jwt: Jwt): ReadAllResponse {
        val notifications = notificationRepository.findAllByUserId(
            UUID.fromString(jwt.subject),
            PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "createdAt")),
        ).content
        notifications.forEach {
            it.readAt = it.readAt ?: OffsetDateTime.now()
            notificationRepository.save(it)
        }
        return ReadAllResponse(updated = notifications.size)
    }
}
