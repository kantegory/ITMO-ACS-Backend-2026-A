package ru.itmo.pxdkxvan.lab23.user.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "roles")
class RoleEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false, unique = true)
    var name: String = "",
    var description: String? = null,
)
