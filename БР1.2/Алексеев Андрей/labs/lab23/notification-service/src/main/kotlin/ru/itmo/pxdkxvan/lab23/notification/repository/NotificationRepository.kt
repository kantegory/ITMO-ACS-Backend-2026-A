package ru.itmo.pxdkxvan.lab23.notification.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.notification.entity.NotificationEntity
import java.util.UUID

interface NotificationRepository : JpaRepository<NotificationEntity, UUID> {
    fun findAllByUserId(userId: UUID, pageable: org.springframework.data.domain.Pageable): org.springframework.data.domain.Page<NotificationEntity>
}
