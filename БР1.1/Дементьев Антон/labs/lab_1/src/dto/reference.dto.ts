import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { PageQuery } from '../common/pagination';
import { Trim } from './common';

export class SkillsQuery extends PageQuery {
    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(100)
    query?: string;
}

export class CreateSkillDto {
    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;
}
