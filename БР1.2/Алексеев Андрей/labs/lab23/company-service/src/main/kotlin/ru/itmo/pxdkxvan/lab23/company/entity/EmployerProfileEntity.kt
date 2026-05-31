package ru.itmo.pxdkxvan.lab23.company.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "employer_profiles")
class EmployerProfileEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false, unique = true)
    var userId: UUID? = null,
    @Column(nullable = false)
    var companyId: UUID? = null,
    @Column(nullable = false)
    var position: String = "",
)
