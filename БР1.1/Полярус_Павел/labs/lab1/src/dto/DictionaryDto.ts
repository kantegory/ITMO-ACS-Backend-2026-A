import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNameDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateNameDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  countryId: string;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsUUID()
  countryId?: string;
}
