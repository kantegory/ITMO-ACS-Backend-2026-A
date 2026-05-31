package ru.itmo.pxdkxvan.lab23.application.mapper;

import java.time.OffsetDateTime;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationResponse;
import ru.itmo.pxdkxvan.lab23.application.dto.InterviewInvitationResponse;
import ru.itmo.pxdkxvan.lab23.application.entity.ApplicationEntity;
import ru.itmo.pxdkxvan.lab23.application.entity.InterviewInvitationEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:25:05+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class ApplicationMapperImpl implements ApplicationMapper {

    @Override
    public ApplicationResponse toApplicationResponse(ApplicationEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID vacancyId = null;
        UUID resumeId = null;
        UUID applicantUserId = null;
        String status = null;
        String coverLetter = null;
        OffsetDateTime createdAt = null;
        OffsetDateTime statusChangedAt = null;

        id = entity.getId();
        vacancyId = entity.getVacancyId();
        resumeId = entity.getResumeId();
        applicantUserId = entity.getApplicantUserId();
        status = entity.getStatus();
        coverLetter = entity.getCoverLetter();
        createdAt = entity.getCreatedAt();
        statusChangedAt = entity.getStatusChangedAt();

        ApplicationResponse applicationResponse = new ApplicationResponse( id, vacancyId, resumeId, applicantUserId, status, coverLetter, createdAt, statusChangedAt );

        return applicationResponse;
    }

    @Override
    public InterviewInvitationResponse toInterviewInvitationResponse(InterviewInvitationEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID applicationId = null;
        OffsetDateTime scheduledAt = null;
        String format = null;
        String notes = null;
        OffsetDateTime createdAt = null;

        id = entity.getId();
        applicationId = entity.getApplicationId();
        scheduledAt = entity.getScheduledAt();
        format = entity.getFormat();
        notes = entity.getNotes();
        createdAt = entity.getCreatedAt();

        InterviewInvitationResponse interviewInvitationResponse = new InterviewInvitationResponse( id, applicationId, scheduledAt, format, notes, createdAt );

        return interviewInvitationResponse;
    }
}
