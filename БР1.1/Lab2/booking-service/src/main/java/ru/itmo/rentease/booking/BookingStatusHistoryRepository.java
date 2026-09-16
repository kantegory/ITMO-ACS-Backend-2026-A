package ru.itmo.rentease.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookingStatusHistoryRepository extends JpaRepository<BookingStatusHistoryEntity, UUID> {
}
