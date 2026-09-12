package ru.itmo.rentease.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.itmo.rentease.Domain.Role;
import ru.itmo.rentease.Domain.UserRole;

public interface UserRoleRepository extends JpaRepository<UserRole, Role> {
}
