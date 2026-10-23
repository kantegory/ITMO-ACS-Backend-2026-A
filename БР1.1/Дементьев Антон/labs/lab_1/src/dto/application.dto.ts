import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ApplicationStatus } from '../models/enums';

export class CreateApplicationDto {
    @IsUUID()
    resume_id: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    cover_letter?: string | null;
}

export class UpdateApplicationStatusDto {
    @IsIn([ApplicationStatus.VIEWED, ApplicationStatus.INVITED, ApplicationStatus.REJECTED])
    status: ApplicationStatus;
}
