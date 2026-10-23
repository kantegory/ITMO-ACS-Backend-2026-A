import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { Trim } from './common';

export class CreateCompanyDto {
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    name: string;

    @IsUUID()
    industry_id: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    description?: string | null;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(255)
    website_url?: string | null;
}

export class UpdateCompanyDto {
    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    name?: string;

    @IsOptional()
    @IsUUID()
    industry_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(4000)
    description?: string | null;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(255)
    website_url?: string | null;
}
