package ru.itmo.pxdkxvan.lab23.company.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "companies")
class CompanyEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false)
    var title: String = "",
    @Column(nullable = false)
    var ownerUserId: UUID? = null,
    var description: String? = null,
    var website: String? = null,
    var industryHint: String? = null,
    var address: String? = null,
    var employeeCount: Long? = null,
)
