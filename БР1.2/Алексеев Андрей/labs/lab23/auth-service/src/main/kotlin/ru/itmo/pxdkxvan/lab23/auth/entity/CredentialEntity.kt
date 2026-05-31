package ru.itmo.pxdkxvan.lab23.auth.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "credentials")
class CredentialEntity(
    @Id
    @GeneratedValue
    var id: UUID? = null,
    @Column(nullable = false, unique = true)
    var userId: UUID? = null,
    @Column(nullable = false, unique = true)
    var email: String = "",
    @Column(nullable = false)
    var passwordHash: String = "",
    var refreshToken: String? = null,
)
