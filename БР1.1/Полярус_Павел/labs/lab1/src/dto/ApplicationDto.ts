import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApplicationStatus } from '../entities/Application';

export class CreateApplicationDto {
  @IsUUID()
  vacancyId: string;

  @IsUUID()
  resumeId: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;
}

export class UpdateApplicationStatusDto {
  @IsEnum([
    ApplicationStatus.VIEWED,
    ApplicationStatus.INVITED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.ACCEPTED,
  ])
  status: ApplicationStatus;
}
