package ru.itmo.pxdkxvan.lab23.notification.mapper

import org.mapstruct.Mapper
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab23.notification.dto.NotificationResponse
import ru.itmo.pxdkxvan.lab23.notification.entity.NotificationEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface NotificationMapper {
    fun toNotificationResponse(entity: NotificationEntity): NotificationResponse
}
