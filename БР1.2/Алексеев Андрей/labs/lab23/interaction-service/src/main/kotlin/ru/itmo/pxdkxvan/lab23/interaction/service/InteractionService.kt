package ru.itmo.pxdkxvan.lab23.interaction.service

import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import ru.itmo.pxdkxvan.lab23.interaction.client.VacancyClient
import ru.itmo.pxdkxvan.lab23.interaction.dto.FavoriteVacancyResponse
import ru.itmo.pxdkxvan.lab23.interaction.config.InteractionProperties
import ru.itmo.pxdkxvan.lab23.interaction.dto.Meta
import ru.itmo.pxdkxvan.lab23.interaction.dto.PageResponse
import ru.itmo.pxdkxvan.lab23.interaction.dto.VacancyViewResponse
import ru.itmo.pxdkxvan.lab23.interaction.entity.FavoriteVacancyEntity
import ru.itmo.pxdkxvan.lab23.interaction.entity.VacancyViewEntity
import ru.itmo.pxdkxvan.lab23.interaction.mapper.InteractionMapper
import ru.itmo.pxdkxvan.lab23.interaction.repository.FavoriteRepository
import ru.itmo.pxdkxvan.lab23.interaction.repository.ViewRepository
import java.util.UUID

@Service
class InteractionService(
    private val favoriteRepository: FavoriteRepository,
    private val viewRepository: ViewRepository,
    private val vacancyClient: VacancyClient,
    private val interactionEventPublisher: InteractionEventPublisher,
    private val interactionProperties: InteractionProperties,
    private val interactionMapper: InteractionMapper,
) {
    @Transactional(readOnly = true)
    fun myFavorites(jwt: Jwt, page: Int, limit: Int): PageResponse<FavoriteVacancyResponse> {
        val result = favoriteRepository.findAllByUserId(
            UUID.fromString(jwt.subject),
            PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt")),
        )
        return PageResponse(result.content.map(interactionMapper::toFavoriteVacancyResponse), Meta(page, limit, result.totalElements))
    }

    @Transactional
    fun addFavorite(jwt: Jwt, vacancyId: UUID): FavoriteVacancyResponse {
        val context = vacancyClient.publicContext(interactionProperties.security.serviceToken, vacancyId)
        require(context.published) { "Vacancy is not published" }

        val userId = UUID.fromString(jwt.subject)
        require(favoriteRepository.findByUserIdAndVacancyId(userId, vacancyId) == null) { "Already in favorites" }

        return favoriteRepository.save(FavoriteVacancyEntity(userId = userId, vacancyId = vacancyId)).also {
            interactionEventPublisher.publish("VacancyAddedToFavorites", userId, vacancyId)
        }.let(interactionMapper::toFavoriteVacancyResponse)
    }

    @Transactional
    fun removeFavorite(jwt: Jwt, vacancyId: UUID) {
        val favorite = favoriteRepository.findByUserIdAndVacancyId(UUID.fromString(jwt.subject), vacancyId)
            ?: throw NoSuchElementException("Favorite not found")
        favoriteRepository.delete(favorite)
        interactionEventPublisher.publish("VacancyRemovedFromFavorites", favorite.userId!!, vacancyId)
    }

    @Transactional(readOnly = true)
    fun myViews(jwt: Jwt, page: Int, limit: Int): PageResponse<VacancyViewResponse> {
        val result = viewRepository.findAllByUserId(
            UUID.fromString(jwt.subject),
            PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt")),
        )
        return PageResponse(result.content.map(interactionMapper::toVacancyViewResponse), Meta(page, limit, result.totalElements))
    }

    @Transactional
    fun addView(jwt: Jwt, vacancyId: UUID): VacancyViewResponse {
        val context = vacancyClient.publicContext(interactionProperties.security.serviceToken, vacancyId)
        require(context.published) { "Vacancy is not published" }

        return viewRepository.save(
            VacancyViewEntity(
                userId = UUID.fromString(jwt.subject),
                vacancyId = vacancyId,
            ),
        ).also {
            interactionEventPublisher.publish("VacancyViewed", it.userId!!, vacancyId)
        }.let(interactionMapper::toVacancyViewResponse)
    }
}
