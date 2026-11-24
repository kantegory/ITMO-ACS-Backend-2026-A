package ru.itmo.pxdkxvan.lab23.vacancy.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "experience_levels")
class ExperienceLevelEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false, unique = true)
    var code: String = "",
    @Column(nullable = false)
    var displayName: String = "",
)
