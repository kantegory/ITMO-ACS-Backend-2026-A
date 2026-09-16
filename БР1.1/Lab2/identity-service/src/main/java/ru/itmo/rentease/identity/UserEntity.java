package ru.itmo.rentease.identity;

import jakarta.persistence.*;
import ru.itmo.rentease.common.Role;

import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    public UUID id = UUID.randomUUID();
    @Column(nullable = false, unique = true)
    public String email;
    @Column(name = "password_hash", nullable = false)
    public String passwordHash;
    @Column(name = "full_name", nullable = false)
    public String fullName;
    @Column(nullable = false)
    public String phone;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public Role role;
    @Column(nullable = false)
    public boolean active = true;
}
