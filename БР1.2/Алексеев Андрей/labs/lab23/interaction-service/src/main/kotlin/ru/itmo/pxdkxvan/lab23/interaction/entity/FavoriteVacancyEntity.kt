package ru.itmo.pxdkxvan.lab23.interaction.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "favorite_vacancies")
class FavoriteVacancyEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false)
    var userId: UUID? = null,
    @Column(nullable = false)
    var vacancyId: UUID? = null,
    @Column(nullable = false)
    var createdAt: OffsetDateTime = OffsetDateTime.now(),
)
