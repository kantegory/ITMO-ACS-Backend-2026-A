import {Body, HttpError, Post, Get, Req, UseBefore} from 'routing-controllers';
import {IsEmail, IsOptional, IsString, MinLength,} from 'class-validator';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import jwt from 'jsonwebtoken';

import dataSource from '../config/data-source';
import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';
import { Seeker } from '../models/seeker.entity';
import { Employer } from '../models/employer.entity';
import { Resume } from '../models/resume.entity';
import { UserRole } from '../models/enums';

import checkPassword from '../utils/check-password';

class RegisterSeekerDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    phone: string;

    @IsString()
    first_name: string;

    @IsString()
    surname: string;

    @IsOptional()
    @IsString()
    middle_name?: string;

    @IsString()
    birth_date: string;

    @IsString()
    city: string;
}

class RegisterEmployerDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    phone: string;

    @IsString()
    company_name: string;

    @IsOptional()
    @IsString()
    company_website?: string;
}

class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})

class AuthController extends BaseController {
    private userRepository = dataSource.getRepository(User);
    private seekerRepository = dataSource.getRepository(Seeker);
    private employerRepository = dataSource.getRepository(Employer);
    private resumeRepository = dataSource.getRepository(Resume);

    @Post('/register/seeker')
    async registerSeeker(@Body() body: RegisterSeekerDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: body.email },
        });
        if (existingUser) {
            throw new HttpError(409, 'Пользователь с таким email уже существует');
        }

        const result = await dataSource.transaction(async (manger) => {
            const user = manger.create(User, {
                email: body.email,
                password: body.password,
                phone: body.phone,
                role: UserRole.SEEKER,
            });
            await manger.save(user);

            const seeker = manger.create(Seeker, {
                user: user,
                firstName: body.first_name,
                surname: body.surname,
                middleName: body.middle_name || null,
                birthDate: body.birth_date,
                city: body.city,
            });
            await manger.save(seeker);

            const resume = manger.create(Resume, {
                seeker: seeker,
                title: 'Новое резюме',
                aboutMe: '',
            });
            await manger.save(resume);

            return { user, seeker, resume };
        });

        return {
            message: 'Пользователь успешно зарегистрирован',
            user_id: result.user.userId,
            profile_id: result.seeker.profileId,
            resume_id: result.resume.resumeId,
        };
    }

    @Post('/register/employer')
    async registerEmployer(@Body() body: RegisterEmployerDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: body.email },
        });
        if (existingUser) {
            throw new HttpError(409, 'Пользователь с таким email уже существует');
        }

        const result = await dataSource.transaction(async (manger) => {
            const user = manger.create(User, {
                email: body.email,
                password: body.password,
                phone: body.phone,
                role: UserRole.EMPLOYER,
            });
            await manger.save(user);

            const employer = manger.create(Employer, {
                user: user,
                companyName: body.company_name,
                companyWebsite: body.company_website || null,
            });
            await manger.save(employer);
            
            return { user, employer };
        });

        return {
            message: 'Работодатель успешно зарегистрирован',
            userId: result.user.userId,
            role: result.user.role,
            profileId: result.employer.profileId,
        };
    }

    @Post('/login')
    async login(@Body() body: LoginDto) {
        const user = await this.userRepository.findOne({
            where: { email: body.email },
            relations: { seekerProfile: true, employerProfile: true },
        });

        if (!user) {
            throw new HttpError(401, 'Неверный email или пароль');
        }

        const isPasswordCorrect = checkPassword(user.password, body.password);

        if (!isPasswordCorrect) {
            throw new HttpError(401, 'Неверный email или пароль');
        }

        const profileId = user.role === UserRole.SEEKER ? user.seekerProfile?.profileId : user.employerProfile?.profileId;

        const accessToken = jwt.sign(
            {
                user: {
                    userId: user.userId,
                    role: user.role,
                    profileId: profileId,
                },
            },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return {
            message: 'Вход выполнен успешно',
            accessToken: accessToken,
            token_type: SETTINGS.JWT_TOKEN_TYPE,
            user_id: user.userId,
            role: user.role,
            profile_id: profileId,
        };
    }

    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() request: RequestWithUser) {
        return {
            user: request.user,
        };
    }
}

export default AuthController;

                


            

