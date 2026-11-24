package ru.itmo.pxdkxvan.lab1.user.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.Table
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.hibernate.annotations.UuidGenerator
import ru.itmo.pxdkxvan.lab1.role.entity.RoleEntity
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "\"user\"")
class UserAccountEntity {
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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_role",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")],
    )
    val roles: MutableSet<RoleEntity> = linkedSetOf()

    @Column(name = "first_name", nullable = false, length = 100)
    lateinit var firstName: String

    @Column(name = "last_name", nullable = false, length = 100)
    lateinit var lastName: String

    @Column(name = "middle_name", length = 100)
    var middleName: String? = null

    @Column(name = "email", nullable = false, unique = true, length = 255)
    lateinit var email: String

    @Column(name = "phone", nullable = false, unique = true, length = 32)
    lateinit var phone: String

    @Column(name = "password_hash", nullable = false, length = 255)
    lateinit var passwordHash: String

    @Column(name = "is_verified", nullable = false)
    var isVerified: Boolean = false
}
