package ru.itmo.pxdkxvan.lab23.company.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.company.entity.CompanyEntity
import java.util.UUID

interface CompanyRepository : JpaRepository<CompanyEntity, UUID>
