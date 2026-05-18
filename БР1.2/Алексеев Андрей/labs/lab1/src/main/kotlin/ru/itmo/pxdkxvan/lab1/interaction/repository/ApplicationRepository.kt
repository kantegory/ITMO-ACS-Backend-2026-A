package ru.itmo.pxdkxvan.lab1.interaction.repository

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

interface ApplicationRepository : JpaRepository<ApplicationEntity, UUID> {
    fun findAllByVacancy(vacancy: VacancyEntity, pageable: Pageable): Page<ApplicationEntity>

    @Query("select a from ApplicationEntity a join a.resume r where r.user = :user")
    fun findAllByApplicant(@Param("user") user: UserAccountEntity, pageable: Pageable): Page<ApplicationEntity>

    fun existsByVacancyAndResume(vacancy: VacancyEntity, resume: ResumeEntity): Boolean
}
