import { IsOptional, IsString, IsUrl, Length } from "class-validator";

export class CreateWorkoutCategoryDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  iconUrl?: string;
}

export class CreateBlogCategoryDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsString()
  @Length(2, 80)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}
