package ru.itmo.pxdkxvan.lab23.search.mapper;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.search.dto.VacancySearchResponse;
import ru.itmo.pxdkxvan.lab23.search.entity.VacancyDocument;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:26:30+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class SearchMapperImpl implements SearchMapper {

    @Override
    public VacancySearchResponse toVacancySearchResponse(VacancyDocument entity) {
        if ( entity == null ) {
            return null;
        }

        String title = null;
        String description = null;
        String companyName = null;
        String country = null;
        String city = null;
        String metro = null;
        BigDecimal salaryFrom = null;
        BigDecimal salaryTo = null;
        String currency = null;
        String industryCode = null;
        String experienceLevelCode = null;
        String employmentType = null;
        String workFormat = null;
        String educationLevel = null;
        String status = null;
        OffsetDateTime publishedAt = null;
        long viewCount = 0L;
        long favoriteCount = 0L;

        title = entity.getTitle();
        description = entity.getDescription();
        companyName = entity.getCompanyName();
        country = entity.getCountry();
        city = entity.getCity();
        metro = entity.getMetro();
        salaryFrom = entity.getSalaryFrom();
        salaryTo = entity.getSalaryTo();
        currency = entity.getCurrency();
        industryCode = entity.getIndustryCode();
        experienceLevelCode = entity.getExperienceLevelCode();
        employmentType = entity.getEmploymentType();
        workFormat = entity.getWorkFormat();
        educationLevel = entity.getEducationLevel();
        status = entity.getStatus();
        publishedAt = entity.getPublishedAt();
        viewCount = entity.getViewCount();
        favoriteCount = entity.getFavoriteCount();

        UUID vacancyId = java.util.UUID.fromString(entity.getVacancyId());
        UUID companyId = entity.getCompanyId() == null ? null : java.util.UUID.fromString(entity.getCompanyId());
        List<String> skillCodes = java.util.List.of();

        VacancySearchResponse vacancySearchResponse = new VacancySearchResponse( vacancyId, title, description, companyId, companyName, country, city, metro, salaryFrom, salaryTo, currency, industryCode, experienceLevelCode, employmentType, workFormat, educationLevel, status, publishedAt, skillCodes, viewCount, favoriteCount );

        VacancySearchResponse target = enrichVacancySearchResponse( entity, vacancySearchResponse );
        if ( target != null ) {
            return target;
        }

        return vacancySearchResponse;
    }
}
