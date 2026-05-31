package ru.itmo.pxdkxvan.lab23.vacancy.mapper;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.vacancy.dto.DictionaryResponse;
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyAssignmentResponse;
import ru.itmo.pxdkxvan.lab23.vacancy.dto.VacancyResponse;
import ru.itmo.pxdkxvan.lab23.vacancy.entity.ExperienceLevelEntity;
import ru.itmo.pxdkxvan.lab23.vacancy.entity.IndustryEntity;
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyAssignmentEntity;
import ru.itmo.pxdkxvan.lab23.vacancy.entity.VacancyEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:25:02+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class VacancyMapperImpl implements VacancyMapper {

    @Override
    public DictionaryResponse toIndustryResponse(IndustryEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        String code = null;
        String displayName = null;

        id = entity.getId();
        code = entity.getCode();
        displayName = entity.getDisplayName();

        DictionaryResponse dictionaryResponse = new DictionaryResponse( id, code, displayName );

        return dictionaryResponse;
    }

    @Override
    public DictionaryResponse toExperienceLevelResponse(ExperienceLevelEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        String code = null;
        String displayName = null;

        id = entity.getId();
        code = entity.getCode();
        displayName = entity.getDisplayName();

        DictionaryResponse dictionaryResponse = new DictionaryResponse( id, code, displayName );

        return dictionaryResponse;
    }

    @Override
    public VacancyAssignmentResponse toVacancyAssignmentResponse(VacancyAssignmentEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID vacancyId = null;
        UUID employerProfileId = null;
        UUID employerUserId = null;
        String assignmentRole = null;

        id = entity.getId();
        vacancyId = entity.getVacancyId();
        employerProfileId = entity.getEmployerProfileId();
        employerUserId = entity.getEmployerUserId();
        assignmentRole = entity.getAssignmentRole();

        VacancyAssignmentResponse vacancyAssignmentResponse = new VacancyAssignmentResponse( id, vacancyId, employerProfileId, employerUserId, assignmentRole );

        return vacancyAssignmentResponse;
    }

    @Override
    public VacancyResponse toVacancyResponse(VacancyEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID companyId = null;
        UUID createdByUserId = null;
        String title = null;
        String description = null;
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
        String companyName = null;
        String status = null;
        OffsetDateTime publishedAt = null;
        boolean acceptsApplications = false;

        id = entity.getId();
        companyId = entity.getCompanyId();
        createdByUserId = entity.getCreatedByUserId();
        title = entity.getTitle();
        description = entity.getDescription();
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
        companyName = entity.getCompanyName();
        status = entity.getStatus();
        publishedAt = entity.getPublishedAt();
        acceptsApplications = entity.getAcceptsApplications();

        List<String> skillCodes = java.util.List.of();

        VacancyResponse vacancyResponse = new VacancyResponse( id, companyId, createdByUserId, title, description, country, city, metro, salaryFrom, salaryTo, currency, industryCode, experienceLevelCode, employmentType, workFormat, educationLevel, companyName, status, publishedAt, acceptsApplications, skillCodes );

        VacancyResponse target = enrichVacancyResponse( entity, vacancyResponse );
        if ( target != null ) {
            return target;
        }

        return vacancyResponse;
    }
}
