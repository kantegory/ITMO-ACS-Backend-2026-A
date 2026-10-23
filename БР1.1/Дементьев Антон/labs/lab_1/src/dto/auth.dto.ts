import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength, Length } from 'class-validator';

import { Role } from '../models/enums';
import { PASSWORD_MESSAGE, PASSWORD_REGEX, Trim } from './common';

export class RegisterDto {
    @Trim()
    @IsEmail()
    @MaxLength(300)
    email: string;

    @IsString()
    @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
    password: string;

    @IsIn([Role.JOBSEEKER, Role.EMPLOYER])
    role: Role;

    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    last_name: string;

    @Trim()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    first_name: string;

    @IsOptional()
    @Trim()
    @IsString()
    @MaxLength(100)
    middle_name?: string | null;
}

export class VerifyEmailDto {
    @Trim()
    @IsEmail()
    email: string;

    @IsString()
    @Length(6, 6)
    code: string;
}

export class ResendVerificationDto {
    @Trim()
    @IsEmail()
    email: string;
}

export class LoginDto {
    @Trim()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(1)
    password: string;
}

export class RefreshDto {
    @IsString()
    @MinLength(1)
    refresh_token: string;
}

export class LogoutDto {
    @IsString()
    @MinLength(1)
    refresh_token: string;
}

export class PasswordChangeRequestDto {
    @IsString()
    @MinLength(1)
    current_password: string;
}

export class PasswordChangeConfirmDto {
    @IsString()
    @Length(6, 6)
    code: string;

    @IsString()
    @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
    new_password: string;
}
