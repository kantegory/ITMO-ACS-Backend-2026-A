import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegisterEmployerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
