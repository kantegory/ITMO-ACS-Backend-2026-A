package ru.itmo.rentease.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.itmo.rentease.Domain.*;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    Optional<Account> findByEmail(String email);
    boolean existsByEmail(String email);
}
