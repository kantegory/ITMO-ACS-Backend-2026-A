package ru.itmo.rentease.identity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import ru.itmo.rentease.common.Role;

@Entity
@Table(name = "user_roles")
public class UserRoleEntity {
    @Id
    @Enumerated(EnumType.STRING)
    public Role name;

    protected UserRoleEntity() {}
    public UserRoleEntity(Role name) { this.name = name; }
}
