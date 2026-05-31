package ru.itmo.pxdkxvan.lab23.vacancy.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.vacancy.entity.IndustryEntity
import java.util.UUID

interface IndustryRepository : JpaRepository<IndustryEntity, UUID>
