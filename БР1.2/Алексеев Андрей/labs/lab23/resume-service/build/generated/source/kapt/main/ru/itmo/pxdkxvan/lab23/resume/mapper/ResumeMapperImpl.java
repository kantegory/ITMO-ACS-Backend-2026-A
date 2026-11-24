package ru.itmo.pxdkxvan.lab23.resume.mapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.resume.dto.ResumeResponse;
import ru.itmo.pxdkxvan.lab23.resume.entity.ResumeEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:26:24+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class ResumeMapperImpl implements ResumeMapper {

    @Override
    public ResumeResponse toResumeResponse(ResumeEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID userId = null;
        String title = null;
        String desiredPosition = null;
        String aboutMe = null;
        BigDecimal salaryExpectation = null;
        String city = null;
        String employmentType = null;
        String workFormat = null;
        String status = null;
        String educationLevel = null;
        String experienceLevelCode = null;

        id = entity.getId();
        userId = entity.getUserId();
        title = entity.getTitle();
        desiredPosition = entity.getDesiredPosition();
        aboutMe = entity.getAboutMe();
        salaryExpectation = entity.getSalaryExpectation();
        city = entity.getCity();
        employmentType = entity.getEmploymentType();
        workFormat = entity.getWorkFormat();
        status = entity.getStatus();
        educationLevel = entity.getEducationLevel();
        experienceLevelCode = entity.getExperienceLevelCode();

        List<String> skillCodes = java.util.List.of();

        ResumeResponse resumeResponse = new ResumeResponse( id, userId, title, desiredPosition, aboutMe, salaryExpectation, city, employmentType, workFormat, status, educationLevel, experienceLevelCode, skillCodes );

        ResumeResponse target = enrichResumeResponse( entity, resumeResponse );
        if ( target != null ) {
            return target;
        }

        return resumeResponse;
    }
}
