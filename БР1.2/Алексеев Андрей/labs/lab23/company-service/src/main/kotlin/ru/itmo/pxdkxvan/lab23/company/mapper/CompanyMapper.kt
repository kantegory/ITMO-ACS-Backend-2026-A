package ru.itmo.pxdkxvan.lab23.company.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab23.company.dto.CompanyResponse
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileContext
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileResponse
import ru.itmo.pxdkxvan.lab23.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab23.company.entity.EmployerProfileEntity

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface CompanyMapper {
    fun toCompanyResponse(entity: CompanyEntity): CompanyResponse

    fun toEmployerProfileResponse(entity: EmployerProfileEntity): EmployerProfileResponse

    @Mapping(target = "employerProfileId", source = "id")
    fun toEmployerProfileContext(entity: EmployerProfileEntity): EmployerProfileContext
}
