import { Body, Post, Req, UseBefore, BadRequestError } from 'routing-controllers';import { IsEmail, IsOptional, IsString, MinLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';
import { UserProfile } from '../models/user-profile.entity';
import { hashPassword, verifyPassword } from '../utils/password';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { RevokedToken } from '../models/revoked-token.entity';

class RegisterDto {
  @IsEmail()
  @Type(() => String)
  email!: string;

  @IsString()
  @MinLength(8)
  @Type(() => String)
  password!: string;

  @IsString()
  @Type(() => String)
  firstName!: string;

  @IsString()
  @Type(() => String)
  lastName!: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  birthDate?: string;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  @Type(() => Number)
  heightCm?: number;

  @IsOptional()
  @IsString()
  @Type(() => String)
  fitnessGoal?: string;
}

class LoginDto {
  @IsEmail()
  @Type(() => String)
  email!: string;

  @IsString()
  @Type(() => String)
  password!: string;
}

@EntityController({
  baseRoute: '/auth',
  entity: User,
})
class AuthController extends BaseController {
  @Post('/register')
  async register(@Body({ type: RegisterDto }) body: RegisterDto) {
    const userRepository = this.repository;
    const profileRepository = this.repository.manager.getRepository(UserProfile);

    const existingUser = await userRepository.findOneBy({ email: body.email });

    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const hashedPassword = hashPassword(body.password);

    const user = userRepository.create({
      email: body.email,
      password: hashedPassword,
      role: 'user',
      status: 'active',
    });

    const savedUser = await userRepository.save(user);

    const profile = profileRepository.create({
      userId: savedUser.id,
      firstName: body.firstName,
      lastName: body.lastName,
      birthDate: body.birthDate,
      heightCm: body.heightCm,
      fitnessGoal: body.fitnessGoal,
    });

    const savedProfile = await profileRepository.save(profile);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
      profile: savedProfile,
    };
  }

  @Post('/login')
  async login(@Body({ type: LoginDto }) loginData: LoginDto) {
    const { email, password } = loginData;

    const user = await this.repository.findOneBy({ email });

    if (!user) {
      throw new BadRequestError('Password or email is incorrect');
    }

    const isPasswordCorrect = verifyPassword(password, user.password);

    if (!isPasswordCorrect) {
      throw new BadRequestError('Password or email is incorrect');
    }

    const accessToken = jwt.sign(
  { user: { id: user.id, role: user.role } },
      SETTINGS.JWT_SECRET_KEY,
      {
        expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
      },
    );

    const profileRepository = this.repository.manager.getRepository(UserProfile);
    const profile = await profileRepository.findOneBy({ userId: user.id });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile,
    };
  }

  @Post('/logout')
  @UseBefore(authMiddleware)
  async logout(@Req() request: RequestWithUser) {
    const accessToken = request.accessToken;

    if (!accessToken) {
      throw new BadRequestError('No access token found');
    }

    const revokedTokenRepository = this.repository.manager.getRepository(RevokedToken);

    const existing = await revokedTokenRepository.findOneBy({ token: accessToken });
    if (existing) {
      return { success: true };
    }

    const decoded = jwt.decode(accessToken) as jwt.JwtPayload | null;

    let expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    if (decoded?.exp) {
      expiresAt = new Date(decoded.exp * 1000);
    }

    const revokedToken = revokedTokenRepository.create({
      token: accessToken,
      expiresAt,
    });

    await revokedTokenRepository.save(revokedToken);

    return { success: true };
  }

}

export default AuthController;