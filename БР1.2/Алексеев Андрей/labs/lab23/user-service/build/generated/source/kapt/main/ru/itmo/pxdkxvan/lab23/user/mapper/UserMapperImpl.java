package ru.itmo.pxdkxvan.lab23.user.mapper;

import java.util.List;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.user.dto.AuthContextResponse;
import ru.itmo.pxdkxvan.lab23.user.dto.NotificationContextResponse;
import ru.itmo.pxdkxvan.lab23.user.dto.RoleResponse;
import ru.itmo.pxdkxvan.lab23.user.dto.UserResponse;
import ru.itmo.pxdkxvan.lab23.user.entity.RoleEntity;
import ru.itmo.pxdkxvan.lab23.user.entity.UserEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:26:31+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserResponse toUserResponse(UserEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        String firstName = null;
        String lastName = null;
        String middleName = null;
        String email = null;
        String phone = null;
        boolean active = false;

        id = entity.getId();
        firstName = entity.getFirstName();
        lastName = entity.getLastName();
        middleName = entity.getMiddleName();
        email = entity.getEmail();
        phone = entity.getPhone();
        active = entity.getActive();

        List<String> roles = java.util.List.of();

        UserResponse userResponse = new UserResponse( id, firstName, lastName, middleName, email, phone, active, roles );

        UserResponse target = enrichUserResponse( entity, userResponse );
        if ( target != null ) {
            return target;
        }

        return userResponse;
    }

    @Override
    public AuthContextResponse toAuthContextResponse(UserEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID userId = null;
        String email = null;
        boolean active = false;

        userId = entity.getId();
        email = entity.getEmail();
        active = entity.getActive();

        List<String> roles = java.util.List.of();

        AuthContextResponse authContextResponse = new AuthContextResponse( userId, email, roles, active );

        AuthContextResponse target = enrichAuthContextResponse( entity, authContextResponse );
        if ( target != null ) {
            return target;
        }

        return authContextResponse;
    }

    @Override
    public NotificationContextResponse toNotificationContextResponse(UserEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID userId = null;
        String email = null;
        String firstName = null;

        userId = entity.getId();
        email = entity.getEmail();
        firstName = entity.getFirstName();

        NotificationContextResponse notificationContextResponse = new NotificationContextResponse( userId, email, firstName );

        return notificationContextResponse;
    }

    @Override
    public RoleResponse toRoleResponse(RoleEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        String name = null;
        String description = null;

        id = entity.getId();
        name = entity.getName();
        description = entity.getDescription();

        RoleResponse roleResponse = new RoleResponse( id, name, description );

        return roleResponse;
    }
}
