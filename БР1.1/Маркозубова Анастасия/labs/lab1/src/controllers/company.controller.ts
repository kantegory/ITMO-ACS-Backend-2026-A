import {
    Body,
    Get,
    Post,
    Patch,
    Param,
    UseBefore,
    Req,
    HttpError,
} from 'routing-controllers';

import { IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import AuthOpenAPI, { PublicOpenAPI } from '../common/auth-openapi';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Company } from '../models/company.entity';
import { User } from '../models/user.entity';

import authMiddleware from '../middlewares/auth.middleware';

class CreateCompanyCheck {
    @IsString()
    @Type(() => String)
    name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    website: string;
}

class UpdateCompanyCheck {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    website: string;
}

@EntityController({
    baseRoute: '/companies',
    entity: Company,
})
class CompanyController extends BaseController {
    @Post('')
    @AuthOpenAPI('Создать профиль компании', ['companies'])
    @UseBefore(authMiddleware)
    async create(
        @Req() request: any,
        @Body({ type: CreateCompanyCheck }) body: CreateCompanyCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can create company profile');
        }

        const existingCompany = await this.repository.findOne({
            where: {
                user: {
                    user_id: currentUserId,
                },
            },
            relations: ['user'],
        });

        if (existingCompany) {
            throw new HttpError(409, 'Company profile already exists');
        }

        const userRepository = User.getRepository();
        const user = await userRepository.findOneBy({
            user_id: currentUserId,
        });

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        const company = this.repository.create({
            name: body.name,
            description: body.description,
            website: body.website,
            user,
        });

        const savedCompany = await this.repository.save(company);
        return savedCompany;
    }

    @Get('/me')
    @AuthOpenAPI('Получить свой профиль компании', ['companies'])
    @UseBefore(authMiddleware)
    async me(@Req() request: any) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can view company profile');
        }

        const company = await this.repository.findOne({
            where: {
                user: {
                    user_id: currentUserId,
                },
            },
            relations: ['user'],
        });

        if (!company) {
            throw new HttpError(404, 'Company profile not found');
        }

        return company;
    }

    @Get('/:id')
    @PublicOpenAPI('Получить компанию', ['companies'])
    async getById(@Param('id') id: number) {
        const company = await this.repository.findOne({
            where: {
                company_id: id,
            },
            relations: ['user'],
        });

        if (!company) {
            throw new HttpError(404, 'Company profile not found');
        }

        return company;
    }

    @Patch('/me')
    @AuthOpenAPI('Обновить свой профиль компании', ['companies'])
    @UseBefore(authMiddleware)
    async update(
        @Req() request: any,
        @Body({ type: UpdateCompanyCheck }) body: UpdateCompanyCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can update company profile');
        }

        const company = await this.repository.findOne({
            where: {
                user: {
                    user_id: currentUserId,
                },
            },
            relations: ['user'],
        });

        if (!company) {
            throw new HttpError(404, 'Company profile not found');
        }

        if (body.name !== undefined) {
            company.name = body.name;
        }

        if (body.description !== undefined) {
            company.description = body.description;
        }

        if (body.website !== undefined) {
            company.website = body.website;
        }

        const updatedCompany = await this.repository.save(company);
        return updatedCompany;
    }

    @Get('/:id/vacancies')
    @PublicOpenAPI('Получить все вакансии компании', ['companies', 'vacancies'])
    async getCompanyVacancies(@Param('id') id: number) {
        const company = await this.repository.findOne({
            where: {
                company_id: id,
            },
            relations: ['vacancies', 'vacancies.specialization'],
        });

        if (!company) {
            throw new HttpError(404, 'Company profile not found');
        }

        return company.vacancies;
    }
}

export default CompanyController;
