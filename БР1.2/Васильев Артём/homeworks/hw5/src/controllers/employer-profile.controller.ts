import {
    Body,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import {
    ensureConflict,
    ensureForbidden,
    ensureFound,
} from '../common/http-errors';
import { EmployerProfile } from '../models/employer-profile.entity';
import { Company } from '../models/company.entity';
import { UserRole } from '../models/enums/user-role.enum';
import {
    CreateEmployerProfileDto,
    EmployerProfileListQueryDto,
    UpdateEmployerProfileDto,
} from '../dto/employer-profile.dto';

@EntityController({
    baseRoute: '/employer-profiles',
    entity: EmployerProfile,
})
class EmployerProfileController extends BaseController {
    private companyRepository = dataSource.getRepository(Company);

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateEmployerProfileDto })
        payload: CreateEmployerProfileDto,
    ) {
        ensureForbidden(
            [UserRole.EMPLOYER, UserRole.ADMIN].includes(request.user.role),
            'Only employer or admin can create employer profile',
        );

        ensureFound(
            await this.companyRepository.findOneBy({ id: payload.company_id }),
            'Company not found',
        );

        const existingProfile = await this.repository.findOneBy({
            userId: request.user.id,
        });

        ensureConflict(!existingProfile, 'Employer profile already exists');

        const profile = this.repository.create({
            userId: request.user.id,
            companyId: payload.company_id,
            position: payload.position,
        });

        return await this.repository.save(profile);
    }

    @Get('')
    async list(
        @QueryParams({ type: EmployerProfileListQueryDto })
        query: EmployerProfileListQueryDto,
    ) {
        const { page, limit, skip } = resolvePagination(query);
        const qb = this.repository
            .createQueryBuilder('profile')
            .leftJoinAndSelect('profile.company', 'company')
            .leftJoinAndSelect('profile.user', 'user')
            .orderBy('profile.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        if (query.company_id) {
            qb.andWhere('profile.company_id = :companyId', {
                companyId: query.company_id,
            });
        }

        if (query.user_id) {
            qb.andWhere('profile.user_id = :userId', { userId: query.user_id });
        }

        if (query.position) {
            qb.andWhere('profile.position ILIKE :position', {
                position: `%${query.position}%`,
            });
        }

        if (query.search) {
            qb.andWhere(
                '(profile.position ILIKE :search OR company.title ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() request: RequestWithUser) {
        ensureForbidden(
            [UserRole.EMPLOYER, UserRole.ADMIN].includes(request.user.role),
            'Only employer or admin can access employer profile',
        );

        return ensureFound(
            await this.repository.findOne({
                where: { userId: request.user.id },
                relations: ['company', 'user'],
            }),
            'Employer profile not found',
        );
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateEmployerProfileDto })
        payload: UpdateEmployerProfileDto,
    ) {
        const profile = ensureFound(
            await this.repository.findOneBy({ userId: request.user.id }),
            'Employer profile not found',
        ) as EmployerProfile;

        if (payload.company_id) {
            ensureFound(
                await this.companyRepository.findOneBy({
                    id: payload.company_id,
                }),
                'Company not found',
            );
        }

        Object.assign(profile, {
            companyId: payload.company_id ?? profile.companyId,
            position: payload.position ?? profile.position,
        });

        return await this.repository.save(profile);
    }

    @Get('/:id')
    async getById(@Param('id') id: string) {
        return ensureFound(
            await this.repository.findOne({
                where: { id },
                relations: ['company', 'user'],
            }),
            'Employer profile not found',
        );
    }
}

export default EmployerProfileController;
