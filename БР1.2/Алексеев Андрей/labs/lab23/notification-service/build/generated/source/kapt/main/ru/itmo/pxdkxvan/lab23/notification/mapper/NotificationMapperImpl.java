package ru.itmo.pxdkxvan.lab23.notification.mapper;

import java.time.OffsetDateTime;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.notification.dto.NotificationResponse;
import ru.itmo.pxdkxvan.lab23.notification.entity.NotificationEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:24:57+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class NotificationMapperImpl implements NotificationMapper {

    @Override
    public NotificationResponse toNotificationResponse(NotificationEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID userId = null;
        String type = null;
        String title = null;
        String body = null;
        OffsetDateTime createdAt = null;
        OffsetDateTime readAt = null;

        id = entity.getId();
        userId = entity.getUserId();
        type = entity.getType();
        title = entity.getTitle();
        body = entity.getBody();
        createdAt = entity.getCreatedAt();
        readAt = entity.getReadAt();

        NotificationResponse notificationResponse = new NotificationResponse( id, userId, type, title, body, createdAt, readAt );

        return notificationResponse;
    }
}
