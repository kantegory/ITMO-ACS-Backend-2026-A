import {
    Body,
    Delete,
    Get,
    HttpCode,
    OnUndefined,
    Param,
    Patch,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { Brackets } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import { ensureForbidden, ensureFound } from '../common/http-errors';
import { UserRole } from '../models/enums/user-role.enum';
import { Resume } from '../models/resume.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import {
    CreateResumeDto,
    ResumeListQueryDto,
    UpdateResumeDto,
} from '../dto/resume.dto';

@EntityController({
    baseRoute: '/resumes',
    entity: Resume,
})
class ResumeController extends BaseController {
    private experienceRepository = dataSource.getRepository(ResumeExperience);

    private async replaceExperiences(
        resumeId: string,
        experiences: CreateResumeDto['experiences'],
    ) {
        await this.experienceRepository.delete({ resumeId });

        const entities = experiences.map((experience) =>
            this.experienceRepository.create({
                resumeId,
                companyName: experience.company_name,
                position: experience.position,
                description: experience.description,
                startDate: experience.start_date,
                endDate: experience.end_date ?? null,
                monthsCount: experience.months_count,
            }),
        );

        await this.experienceRepository.save(entities);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateResumeDto }) payload: CreateResumeDto,
    ) {
        ensureForbidden(
            [UserRole.APPLICANT, UserRole.ADMIN].includes(request.user.role),
            'Only applicant or admin can create resume',
        );

        const resume = (await this.repository.save(
            this.repository.create({
                userId: request.user.id,
                title: payload.title,
                desiredPosition: payload.desired_position,
                aboutMe: payload.about_me,
                skills: payload.skills,
                education: payload.education,
                salaryExpectation: payload.salary_expectation,
                city: payload.city,
                employmentType: payload.employment_type,
                workFormat: payload.work_format,
                isPublished: payload.is_published,
            }),
        )) as Resume;

        await this.replaceExperiences(resume.id, payload.experiences);

        return ensureFound(
            await this.repository.findOne({
                where: { id: resume.id },
                relations: ['experiences'],
            }),
            'Resume not found',
        );
    }

    @Get('')
    @UseBefore(authMiddleware)
    async list(
        @Req() request: RequestWithUser,
        @QueryParams({ type: ResumeListQueryDto }) query: ResumeListQueryDto,
    ) {
        const { page, limit, skip } = resolvePagination(query);
        const qb = this.repository
            .createQueryBuilder('resume')
            .leftJoinAndSelect('resume.experiences', 'experiences')
            .orderBy('resume.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        if (request.user.role === UserRole.APPLICANT) {
            qb.andWhere('resume.user_id = :userId', {
                userId: request.user.id,
            });
        } else if (request.user.role !== UserRole.ADMIN) {
            qb.andWhere('resume.is_published = true');
        }

        if (query.desired_position) {
            qb.andWhere('resume.desired_position ILIKE :desiredPosition', {
                desiredPosition: `%${query.desired_position}%`,
            });
        }

        if (query.city) {
            qb.andWhere('resume.city ILIKE :city', { city: `%${query.city}%` });
        }

        if (query.employment_type) {
            qb.andWhere('resume.employment_type = :employmentType', {
                employmentType: query.employment_type,
            });
        }

        if (query.work_format) {
            qb.andWhere('resume.work_format = :workFormat', {
                workFormat: query.work_format,
            });
        }

        if (query.salary_expectation_from !== undefined) {
            qb.andWhere('resume.salary_expectation >= :salaryFrom', {
                salaryFrom: query.salary_expectation_from,
            });
        }

        if (query.salary_expectation_to !== undefined) {
            qb.andWhere('resume.salary_expectation <= :salaryTo', {
                salaryTo: query.salary_expectation_to,
            });
        }

        if (
            query.is_published !== undefined &&
            request.user.role === UserRole.ADMIN
        ) {
            qb.andWhere('resume.is_published = :isPublished', {
                isPublished: query.is_published,
            });
        }

        if (query.search) {
            qb.andWhere(
                new Brackets((searchQb) => {
                    searchQb
                        .where('resume.title ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('resume.desired_position ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('resume.about_me ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('resume.skills ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('experiences.company_name ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('experiences.position ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('experiences.description ILIKE :search', {
                            search: `%${query.search}%`,
                        });
                }),
            );
        }

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Get('/:resume_id')
    @UseBefore(authMiddleware)
    async getById(
        @Param('resume_id') resumeId: string,
        @Req() request: RequestWithUser,
    ) {
        const resume = ensureFound(
            await this.repository.findOne({
                where: { id: resumeId },
                relations: ['experiences'],
            }),
            'Resume not found',
        ) as Resume;

        if (request.user.role === UserRole.APPLICANT) {
            ensureForbidden(
                resume.userId === request.user.id,
                'Applicants can access only own resumes',
            );
        } else if (request.user.role !== UserRole.ADMIN) {
            ensureForbidden(resume.isPublished, 'Resume is not published');
        }

        return resume;
    }

    @Patch('/:resume_id')
    @UseBefore(authMiddleware)
    async update(
        @Param('resume_id') resumeId: string,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateResumeDto }) payload: UpdateResumeDto,
    ) {
        const resume = ensureFound(
            await this.repository.findOneBy({ id: resumeId }),
            'Resume not found',
        ) as Resume;

        ensureForbidden(
            request.user.role === UserRole.ADMIN ||
                resume.userId === request.user.id,
            'Only owner can update resume',
        );

        Object.assign(resume, {
            title: payload.title ?? resume.title,
            desiredPosition: payload.desired_position ?? resume.desiredPosition,
            aboutMe: payload.about_me ?? resume.aboutMe,
            skills: payload.skills ?? resume.skills,
            education: payload.education ?? resume.education,
            salaryExpectation:
                payload.salary_expectation ?? resume.salaryExpectation,
            city: payload.city ?? resume.city,
            employmentType: payload.employment_type ?? resume.employmentType,
            workFormat: payload.work_format ?? resume.workFormat,
            isPublished: payload.is_published ?? resume.isPublished,
        });

        await this.repository.save(resume);

        if (payload.experiences) {
            await this.replaceExperiences(resume.id, payload.experiences);
        }

        return ensureFound(
            await this.repository.findOne({
                where: { id: resume.id },
                relations: ['experiences'],
            }),
            'Resume not found',
        );
    }

    @Delete('/:resume_id')
    @HttpCode(204)
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    async remove(
        @Param('resume_id') resumeId: string,
        @Req() request: RequestWithUser,
    ) {
        const resume = ensureFound(
            await this.repository.findOneBy({ id: resumeId }),
            'Resume not found',
        ) as Resume;

        ensureForbidden(
            request.user.role === UserRole.ADMIN ||
                resume.userId === request.user.id,
            'Only owner can delete resume',
        );

        await this.repository.delete({ id: resumeId });
    }
}

export default ResumeController;
