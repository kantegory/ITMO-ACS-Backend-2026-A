package ru.itmo.pxdkxvan.lab23.company.mapper;

import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import ru.itmo.pxdkxvan.lab23.company.dto.CompanyResponse;
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileContext;
import ru.itmo.pxdkxvan.lab23.company.dto.EmployerProfileResponse;
import ru.itmo.pxdkxvan.lab23.company.entity.CompanyEntity;
import ru.itmo.pxdkxvan.lab23.company.entity.EmployerProfileEntity;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-25T02:27:25+0300",
    comments = "version: 1.6.3, compiler: IncrementalProcessingEnvironment from kotlin-annotation-processing-gradle-2.2.21.jar, environment: Java 17.0.19 (Arch Linux)"
)
@Component
public class CompanyMapperImpl implements CompanyMapper {

    @Override
    public CompanyResponse toCompanyResponse(CompanyEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        String title = null;
        String description = null;
        String website = null;
        String industryHint = null;
        String address = null;
        Long employeeCount = null;

        id = entity.getId();
        title = entity.getTitle();
        description = entity.getDescription();
        website = entity.getWebsite();
        industryHint = entity.getIndustryHint();
        address = entity.getAddress();
        employeeCount = entity.getEmployeeCount();

        CompanyResponse companyResponse = new CompanyResponse( id, title, description, website, industryHint, address, employeeCount );

        return companyResponse;
    }

    @Override
    public EmployerProfileResponse toEmployerProfileResponse(EmployerProfileEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID id = null;
        UUID userId = null;
        UUID companyId = null;
        String position = null;

        id = entity.getId();
        userId = entity.getUserId();
        companyId = entity.getCompanyId();
        position = entity.getPosition();

        EmployerProfileResponse employerProfileResponse = new EmployerProfileResponse( id, userId, companyId, position );

        return employerProfileResponse;
    }

    @Override
    public EmployerProfileContext toEmployerProfileContext(EmployerProfileEntity entity) {
        if ( entity == null ) {
            return null;
        }

        UUID employerProfileId = null;
        UUID userId = null;
        UUID companyId = null;
        String position = null;

        employerProfileId = entity.getId();
        userId = entity.getUserId();
        companyId = entity.getCompanyId();
        position = entity.getPosition();

        EmployerProfileContext employerProfileContext = new EmployerProfileContext( employerProfileId, userId, companyId, position );

        return employerProfileContext;
    }
}
