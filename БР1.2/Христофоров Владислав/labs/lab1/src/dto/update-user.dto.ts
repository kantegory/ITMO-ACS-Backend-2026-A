import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsUrl()
    avatar_url?: string;
}
