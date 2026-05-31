package ru.itmo.pxdkxvan.lab1.company.mapper

import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.MappingConstants
import ru.itmo.pxdkxvan.lab1.company.dto.CompanyResponse
import ru.itmo.pxdkxvan.lab1.company.dto.EmployerProfileResponse
import ru.itmo.pxdkxvan.lab1.company.entity.CompanyEntity
import ru.itmo.pxdkxvan.lab1.company.entity.EmployerProfileEntity
import ru.itmo.pxdkxvan.lab1.user.entity.UserAccountEntity
import java.math.BigDecimal

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
interface CompanyMapper {
    fun toCompanyResponse(entity: CompanyEntity): CompanyResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    fun fromRawData(
        title: String,
        description: String?,
        website: String?,
        industryHint: String?,
        address: String?,
        employeeCount: BigDecimal?,
    ): CompanyEntity

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "companyId", source = "company.id")
    fun toEmployerProfileResponse(entity: EmployerProfileEntity): EmployerProfileResponse

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "user", source = "user")
    @Mapping(target = "company", source = "company")
    fun fromRawData(
        user: UserAccountEntity,
        company: CompanyEntity,
        position: String,
    ): EmployerProfileEntity
}
