import { IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@jobsearch/common';

// Все поля необязательные: PATCH меняет только то, что передано.
// null очищает необязательное поле.
export class UpdateProfileDto {
    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    last_name?: string;

    @IsOptional()
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    first_name?: string;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(100)
    middle_name?: string | null;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(32)
    phone?: string | null;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(100)
    city?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    about?: string | null;

    @IsOptional()
    @IsISO8601({ strict: true })
    birth_date?: string | null;
}
