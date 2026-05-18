import {
    Body,
    ForbiddenError,
    Get,
    HttpError,
    NotFoundError,
    Param,
    Patch,
    Req,
    UseBefore,
} from 'routing-controllers';
import {
    IsEmail,
    IsOptional,
    IsString,
} from 'class-validator';

import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import allowRoles from '../middlewares/role.middleware';

import { UserRole } from '../models/enums';
import { User } from '../models/user.entity';
import { Employer } from '../models/employer.entity';

import { serializeEmployerProfile } from '../views/serializers';

class UpdateEmployerProfileDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    company_name?: string;

    @IsOptional()
    @IsString()
    company_website?: string;
}

@EntityController({
    baseRoute: '/employers',
    entity: Employer,
})

class EmployerProfileController extends BaseController{
    private userRepository = dataSource.getRepository(User);
    private employerRepository = dataSource.getRepository(Employer);

    private ensureOwner(request: RequestWithUser, userId: number) {
        if (request.user.userId !== userId) {
            throw new ForbiddenError('Нет доступа к чужому профилю');
        }
    }

    @Get('/:userId/profile')
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async getProfile(
        @Req() request: RequestWithUser,
        @Param('userId') userId: number,
    ) {
        this.ensureOwner(request, userId);

        const employer = await this.employerRepository.findOne({
            where:{
                user: {
                    userId: Number(userId),
                },
            },
            relations:{
                user: true,
            }
        });
        
        if (!employer) {
            throw new NotFoundError('Профиль работодателя не найден');
        }

        return serializeEmployerProfile(employer);
    }

    @Patch('/:userId/profile')
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async updateProfile(
        @Param('userId') userId: number,
        @Body() body: UpdateEmployerProfileDto,
        @Req() request: RequestWithUser,
    ) {
        this.ensureOwner(request, userId);

        const employer = await this.employerRepository.findOne({
            where: {
                user: {
                    userId: Number(userId),
                },
            },
            relations: {
                user: true,
            },
        });

        if (!employer) {
            throw new NotFoundError('Профиль работодателя не найден');
        }

        if (body.email !== undefined && body.email !== employer.user.email) {
            const userWithSameEmail = await this.userRepository.findOne({
                where: {
                    email: body.email,
                },
            });

            if (userWithSameEmail) {
                throw new HttpError( 409, 'Пользователь с таким email уже существует');
            }

            employer.user.email = body.email;
        }

        if (body.phone !== undefined) {
            employer.user.phone = body.phone;
        }

        if (body.company_name !== undefined) {
            employer.companyName = body.company_name;
        }

        if (body.company_website !== undefined) {
            employer.companyWebsite = body.company_website;
        }

        await this.userRepository.save(employer.user);
        await this.employerRepository.save(employer);

        const updatedEmployer = await this.employerRepository.findOne({
            where: {
                profileId: employer.profileId,
            },
            relations: {
                user: true,
            },
        });

        if (!updatedEmployer) {
            throw new NotFoundError('Профиль работодателя не найден');
        }

        return serializeEmployerProfile(updatedEmployer);

    }
}

export default EmployerProfileController;
