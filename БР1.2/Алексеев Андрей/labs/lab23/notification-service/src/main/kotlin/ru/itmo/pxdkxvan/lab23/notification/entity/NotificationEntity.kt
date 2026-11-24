package ru.itmo.pxdkxvan.lab23.notification.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "notifications")
class NotificationEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false)
    var userId: UUID? = null,
    @Column(nullable = false)
    var type: String = "",
    @Column(nullable = false)
    var title: String = "",
    @Column(nullable = false, length = 2000)
    var body: String = "",
    @Column(nullable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now(),
    var readAt: OffsetDateTime? = null,
)
