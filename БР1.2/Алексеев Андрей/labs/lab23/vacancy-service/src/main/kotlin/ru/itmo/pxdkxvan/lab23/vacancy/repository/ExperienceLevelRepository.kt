package ru.itmo.pxdkxvan.lab23.vacancy.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.vacancy.entity.ExperienceLevelEntity
import java.util.UUID

interface ExperienceLevelRepository : JpaRepository<ExperienceLevelEntity, UUID>
