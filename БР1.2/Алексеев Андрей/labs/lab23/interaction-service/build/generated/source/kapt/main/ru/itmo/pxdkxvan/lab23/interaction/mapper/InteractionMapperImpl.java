package ru.itmo.pxdkxvan.lab23.interaction.mapper;

import java.time.OffsetDateTime;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.interaction.dto.FavoriteVacancyResponse;
import ru.itmo.pxdkxvan.lab23.interaction.dto.VacancyViewResponse;
import ru.itmo.pxdkxvan.lab23.interaction.entity.FavoriteVacancyEntity;
import ru.itmo.pxdkxvan.lab23.interaction.entity.VacancyViewEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:26:31+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class InteractionMapperImpl implements InteractionMapper {

    @Override
    public FavoriteVacancyResponse toFavoriteVacancyResponse(FavoriteVacancyEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID userId = null;
        UUID vacancyId = null;
        OffsetDateTime createdAt = null;

        id = entity.getId();
        userId = entity.getUserId();
        vacancyId = entity.getVacancyId();
        createdAt = entity.getCreatedAt();

        FavoriteVacancyResponse favoriteVacancyResponse = new FavoriteVacancyResponse( id, userId, vacancyId, createdAt );

        return favoriteVacancyResponse;
    }

    @Override
    public VacancyViewResponse toVacancyViewResponse(VacancyViewEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID userId = null;
        UUID vacancyId = null;
        OffsetDateTime createdAt = null;

        id = entity.getId();
        userId = entity.getUserId();
        vacancyId = entity.getVacancyId();
        createdAt = entity.getCreatedAt();

        VacancyViewResponse vacancyViewResponse = new VacancyViewResponse( id, userId, vacancyId, createdAt );

        return vacancyViewResponse;
    }
}
