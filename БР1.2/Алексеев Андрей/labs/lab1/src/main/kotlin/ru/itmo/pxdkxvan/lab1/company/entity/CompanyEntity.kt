package ru.itmo.pxdkxvan.lab1.company.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.hibernate.annotations.UuidGenerator
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "company")
class CompanyEntity {
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

    @Column(name = "title", nullable = false, length = 255)
    lateinit var title: String

    @Column(name = "description")
    var description: String? = null

    @Column(name = "website", length = 255)
    var website: String? = null

    @Column(name = "industry_hint", length = 255)
    var industryHint: String? = null

    @Column(name = "address", length = 255)
    var address: String? = null

    @Column(name = "employee_count", precision = 12, scale = 0)
    var employeeCount: BigDecimal? = null
}
