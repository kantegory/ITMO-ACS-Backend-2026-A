package ru.itmo.pxdkxvan.lab1.dictionary.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.domain.Specification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import ru.itmo.pxdkxvan.lab1.interaction.entity.ApplicationEntity
import ru.itmo.pxdkxvan.lab1.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab1.company.entity.EmployerProfileEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.ExperienceLevelEntity
import ru.itmo.pxdkxvan.lab1.interaction.entity.FavoriteVacancyEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.IndustryEntity
import ru.itmo.pxdkxvan.lab1.resume.entity.ResumeEntity
import ru.itmo.pxdkxvan.lab1.role.entity.RoleEntity
import ru.itmo.pxdkxvan.lab1.dictionary.entity.SkillEntity
import ru.itmo.pxdkxvan.lab1.user.entity.UserAccountEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyAssignmentEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyEntity
import ru.itmo.pxdkxvan.lab1.interaction.entity.VacancyViewEntity
import java.util.UUID

interface ExperienceLevelRepository : JpaRepository<ExperienceLevelEntity, UUID> {
    fun existsByCodeIgnoreCase(code: String): Boolean
    fun findAllByIsActiveTrueOrderByDisplayNameAsc(): List<ExperienceLevelEntity>
}
