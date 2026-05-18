package ru.itmo.pxdkxvan.lab1.dictionary.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.hibernate.annotations.UuidGenerator
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "experience_level")
class ExperienceLevelEntity {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    var id: UUID? = null

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: OffsetDateTime? = null

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime? = null

    @Column(name = "code", nullable = false, unique = true, length = 100)
    lateinit var code: String

    @Column(name = "display_name", nullable = false, length = 150)
    lateinit var displayName: String

    @Column(name = "description", length = 500)
    var description: String? = null

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true
}
