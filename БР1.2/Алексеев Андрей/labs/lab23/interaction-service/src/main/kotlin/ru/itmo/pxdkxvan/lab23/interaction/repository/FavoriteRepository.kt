package ru.itmo.pxdkxvan.lab23.interaction.repository

import org.springframework.data.jpa.repository.JpaRepository
import ru.itmo.pxdkxvan.lab23.interaction.entity.FavoriteVacancyEntity
import java.util.UUID

interface FavoriteRepository : JpaRepository<FavoriteVacancyEntity, UUID> {
    fun findByUserIdAndVacancyId(userId: UUID, vacancyId: UUID): FavoriteVacancyEntity?

    fun findAllByUserId(userId: UUID, pageable: org.springframework.data.domain.Pageable): org.springframework.data.domain.Page<FavoriteVacancyEntity>
}
