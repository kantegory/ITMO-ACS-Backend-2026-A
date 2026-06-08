import { IsString, IsOptional } from 'class-validator';

export class CreateAmenityDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    icon?: string;
}
