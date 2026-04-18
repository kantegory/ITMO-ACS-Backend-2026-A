import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateBlogPostDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsOptional()
    @IsUrl()
    image_url?: string;
}
