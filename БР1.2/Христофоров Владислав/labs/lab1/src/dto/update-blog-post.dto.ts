import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateBlogPostDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsUrl()
    image_url?: string;
}
