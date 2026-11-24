package ru.itmo.pxdkxvan.lab23.application.mapper

import org.mapstruct.Mapper
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab23.application.dto.ApplicationResponse
import ru.itmo.pxdkxvan.lab23.application.dto.InterviewInvitationResponse
import ru.itmo.pxdkxvan.lab23.application.entity.ApplicationEntity
import ru.itmo.pxdkxvan.lab23.application.entity.InterviewInvitationEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface ApplicationMapper {
    fun toApplicationResponse(entity: ApplicationEntity): ApplicationResponse

    fun toInterviewInvitationResponse(entity: InterviewInvitationEntity): InterviewInvitationResponse
}
