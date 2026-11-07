import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { ApplicationStatus } from '../models/enums/application-status.enum';
import { PaginationDto } from './common.dto';

export class CreateApplicationDto {
    @IsUUID()
    @Type(() => String)
    resume_id: string;

    @IsOptional()
    @IsString()
    cover_letter?: string;
}

export class UpdateApplicationStatusDto {
    @IsEnum(ApplicationStatus)
    status: ApplicationStatus;
}

export class VacancyApplicationsQueryDto extends PaginationDto {}
