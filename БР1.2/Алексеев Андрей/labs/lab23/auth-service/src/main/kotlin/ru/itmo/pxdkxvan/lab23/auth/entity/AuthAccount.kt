package ru.itmo.pxdkxvan.lab23.auth.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "auth_accounts")
class AuthAccount(
    @Id val id: UUID = UUID.randomUUID(),
    @Column(nullable = false, unique = true) val email: String,
    @Column(nullable = false, unique = true) val phone: String,
    @Column(nullable = false) val firstName: String,
    @Column(nullable = false) val lastName: String,
    val middleName: String?,
    @Column(nullable = false) val active: Boolean = true,
)
