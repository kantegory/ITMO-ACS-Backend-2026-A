package ru.itmo.pxdkxvan.lab1.interaction.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab1.interaction.dto.ApplicationResponse
import ru.itmo.pxdkxvan.lab1.interaction.dto.FavoriteVacancyResponse
import ru.itmo.pxdkxvan.lab1.interaction.dto.VacancyViewResponse
import ru.itmo.pxdkxvan.lab1.interaction.entity.ApplicationEntity
import ru.itmo.pxdkxvan.lab1.interaction.entity.FavoriteVacancyEntity
import ru.itmo.pxdkxvan.lab1.interaction.entity.VacancyViewEntity
import ru.itmo.pxdkxvan.lab1.resume.entity.ResumeEntity
import ru.itmo.pxdkxvan.lab1.user.entity.UserAccountEntity
import ru.itmo.pxdkxvan.lab1.vacancy.entity.VacancyEntity
import java.time.OffsetDateTime

enum class FavoriteMarker {
    FAVORITE,
}

enum class VacancyViewMarker {
    VIEW,
}

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface InteractionMapper {
    @Mapping(target = "resumeId", source = "resume.id")
    @Mapping(target = "vacancyId", source = "vacancy.id")
    fun toApplicationResponse(entity: ApplicationEntity): ApplicationResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "resume", source = "resume")
    @Mapping(target = "vacancy", source = "vacancy")
    @Mapping(target = "coverLetter", source = "coverLetter")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "statusChangedAt", source = "statusChangedAt")
    fun fromRawData(
        resume: ResumeEntity,
        vacancy: VacancyEntity,
        coverLetter: String?,
        status: String,
        statusChangedAt: OffsetDateTime,
    ): ApplicationEntity

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "vacancyId", source = "vacancy.id")
    fun toFavoriteVacancyResponse(entity: FavoriteVacancyEntity): FavoriteVacancyResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "user", source = "user")
    @Mapping(target = "vacancy", source = "vacancy")
    fun fromRawData(
        user: UserAccountEntity,
        vacancy: VacancyEntity,
        favoriteMarker: FavoriteMarker,
    ): FavoriteVacancyEntity

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "vacancyId", source = "vacancy.id")
    fun toVacancyViewResponse(entity: VacancyViewEntity): VacancyViewResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "user", source = "user")
    @Mapping(target = "vacancy", source = "vacancy")
    fun fromRawData(
        user: UserAccountEntity,
        vacancy: VacancyEntity,
        vacancyViewMarker: VacancyViewMarker,
    ): VacancyViewEntity
}
