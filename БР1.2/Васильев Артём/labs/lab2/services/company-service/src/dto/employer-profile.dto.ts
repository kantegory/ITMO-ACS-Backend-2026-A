import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { SearchDto } from './common.dto';

export class CreateEmployerProfileDto {
    @IsUUID()
    @Type(() => String)
    company_id: string;

    @IsString()
    @MaxLength(255)
    @Type(() => String)
    position: string;
}

export class UpdateEmployerProfileDto {
    @IsOptional()
    @IsUUID()
    @Type(() => String)
    company_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Type(() => String)
    position?: string;
}

export class EmployerProfileListQueryDto extends SearchDto {
    @IsOptional()
    @IsUUID()
    @Type(() => String)
    company_id?: string;

    @IsOptional()
    @IsUUID()
    @Type(() => String)
    user_id?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    position?: string;
}
