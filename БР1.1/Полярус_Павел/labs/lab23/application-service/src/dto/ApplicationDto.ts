import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  resumeId: string;

  @IsUUID()
  vacancyId: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;
}

export class UpdateApplicationStatusDto {
    @IsEnum(['VIEWED', 'INVITED', 'REJECTED', 'ACCEPTED'])
    status: string;
}

export class ApplicationResponseDto {
    id: string;
    resumeId: string;
    vacancyId: string;
    seekerUserId: string;
    coverLetter: string | null;
    status: string;
    creayedAt: Date;
    updatedAt: Date;
}