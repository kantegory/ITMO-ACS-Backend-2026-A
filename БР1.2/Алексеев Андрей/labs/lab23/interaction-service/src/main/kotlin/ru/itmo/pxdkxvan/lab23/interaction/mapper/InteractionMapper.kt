package ru.itmo.pxdkxvan.lab23.interaction.mapper

import org.mapstruct.Mapper
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab23.interaction.dto.FavoriteVacancyResponse
import ru.itmo.pxdkxvan.lab23.interaction.dto.VacancyViewResponse
import ru.itmo.pxdkxvan.lab23.interaction.entity.FavoriteVacancyEntity
import ru.itmo.pxdkxvan.lab23.interaction.entity.VacancyViewEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface InteractionMapper {
    fun toFavoriteVacancyResponse(entity: FavoriteVacancyEntity): FavoriteVacancyResponse

    fun toVacancyViewResponse(entity: VacancyViewEntity): VacancyViewResponse
}
