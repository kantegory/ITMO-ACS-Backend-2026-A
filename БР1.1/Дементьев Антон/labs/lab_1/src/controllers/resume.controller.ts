import {
    Body,
    Delete,
    Get,
    JsonController,
    Param,
    Patch,
    Post,
    Put,
    QueryParams,
    Req,
    Res,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response } from 'express';

import dataSource from '../config/data-source';
import { fail, invalid } from '../common/errors';
import { created, noContent } from '../common/http';
import { pageOptions, paginate } from '../common/pagination';
import { uuidParam } from '../common/validators';
import {
    CreateEducationDto,
    CreateExperienceDto,
    CreateResumeDto,
    MyResumesQuery,
    SetSkillsDto,
    UpdateEducationDto,
    UpdateExperienceDto,
    UpdateResumeDto,
} from '../dto/resume.dto';
import authMiddleware, { requireRole, RequestWithUser } from '../middlewares/auth.middleware';
import { Application } from '../models/application.entity';
import { Role } from '../models/enums';
import { Resume } from '../models/resume.entity';
import { ResumeEducation } from '../models/resume-education.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { ResumeSkill } from '../models/resume-skill.entity';
import { checkSalaryRange, loadOwnedResume, requireIndustry, requireSkills } from '../services/access.service';
import { skillView } from '../views/common.view';
import {
    buildResumeDetail,
    buildResumeShorts,
    educationView,
    experienceView,
} from '../views/resume.view';

const AUTH = { security: [{ bearerAuth: [] }] };
const JOBSEEKER = [authMiddleware, requireRole(Role.JOBSEEKER)];

// В базе дата хранится как ГГГГ-ММ-ДД; если пришло время, отбрасываем его
const dateOnly = (value: string) => value.slice(0, 10);

const checkDates = (start: string, end: string | null | undefined) => {
    if (end && dateOnly(end) < dateOnly(start)) {
        throw invalid('end_date', 'Дата окончания не может быть раньше даты начала');
    }
};

const checkYears = (start: number, end: number | null | undefined) => {
    if (end != null && end < start) {
        throw invalid('end_year', 'Год окончания не может быть меньше года начала');
    }
};

@JsonController('/resumes')
class ResumeController {
    private resumes = () => dataSource.getRepository(Resume);

    @Get('')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Мои резюме', ...AUTH })
    async list(@Req() req: RequestWithUser, @QueryParams({ type: MyResumesQuery }) query: MyResumesQuery) {
        const [list, total] = await this.resumes().findAndCount({
            where: {
                userId: req.user!.id,
                ...(query.is_published !== undefined ? { isPublished: query.is_published } : {}),
            },
            relations: { industry: true },
            order: { updatedAt: 'DESC' },
            ...pageOptions(query),
        });
        return paginate(await buildResumeShorts(list), query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Создание резюме', ...AUTH })
    async create(@Req() req: RequestWithUser, @Body({ type: CreateResumeDto }) body: CreateResumeDto, @Res() res: Response) {
        await requireIndustry(body.industry_id);
        checkSalaryRange(body.salary_exp_from, body.salary_exp_to, 'salary_exp_from');

        const saved = await this.resumes().save(
            this.resumes().create({
                userId: req.user!.id,
                industryId: body.industry_id,
                title: body.title,
                summary: body.summary ?? null,
                salaryExpFrom: body.salary_exp_from ?? null,
                salaryExpTo: body.salary_exp_to ?? null,
                isPublished: body.is_published ?? false,
            }),
        );
        const resume = await loadOwnedResume(saved.id, req.user!.id);
        return created(res, `/resumes/${saved.id}`, await buildResumeDetail(resume));
    }

    @Get('/:resumeId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Просмотр резюме', ...AUTH })
    async get(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string) {
        const resume = await this.resumes().findOne({
            where: { id: uuidParam(resumeId, 'RESUME_NOT_FOUND') },
            relations: { industry: true },
        });
        if (!resume) throw fail('RESUME_NOT_FOUND');

        const isOwner = resume.userId === req.user!.id;
        if (!isOwner) {
            // работодатель видит резюме, только если оно пришло в отклике на его вакансию
            const hasApplication =
                req.user!.role === Role.EMPLOYER &&
                (await dataSource
                    .getRepository(Application)
                    .createQueryBuilder('a')
                    .innerJoin('a.vacancy', 'v')
                    .innerJoin('v.company', 'c')
                    .where('a.resumeId = :resumeId AND c.ownerUserId = :userId', {
                        resumeId: resume.id,
                        userId: req.user!.id,
                    })
                    .getExists());
            if (!hasApplication) throw fail('FORBIDDEN');
        }
        return buildResumeDetail(resume);
    }

    @Patch('/:resumeId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Редактирование резюме', ...AUTH })
    async update(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Body({ type: UpdateResumeDto }) body: UpdateResumeDto,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);

        if (body.industry_id !== undefined) await requireIndustry(body.industry_id);
        const from = body.salary_exp_from !== undefined ? body.salary_exp_from : resume.salaryExpFrom;
        const to = body.salary_exp_to !== undefined ? body.salary_exp_to : resume.salaryExpTo;
        checkSalaryRange(from, to, 'salary_exp_from');

        if (body.title !== undefined) resume.title = body.title;
        if (body.summary !== undefined) resume.summary = body.summary;
        if (body.industry_id !== undefined) resume.industryId = body.industry_id;
        if (body.salary_exp_from !== undefined) resume.salaryExpFrom = body.salary_exp_from;
        if (body.salary_exp_to !== undefined) resume.salaryExpTo = body.salary_exp_to;
        if (body.is_published !== undefined) resume.isPublished = body.is_published;
        // связанную отрасль перезагрузит loadOwnedResume ниже
        delete (resume as any).industry;
        await this.resumes().save(resume);

        return buildResumeDetail(await loadOwnedResume(resume.id, req.user!.id));
    }

    @Delete('/:resumeId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Удаление резюме', ...AUTH })
    async remove(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Res() res: Response) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        if (await dataSource.getRepository(Application).existsBy({ resumeId: resume.id })) {
            throw fail('RESUME_HAS_APPLICATIONS');
        }
        await this.resumes().delete(resume.id);
        return noContent(res);
    }

    // ---------- опыт работы ----------

    @Post('/:resumeId/experiences')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Добавление места работы', ...AUTH })
    async addExperience(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Body({ type: CreateExperienceDto }) body: CreateExperienceDto,
        @Res() res: Response,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        checkDates(body.start_date, body.end_date);

        const repo = dataSource.getRepository(ResumeExperience);
        const saved = await repo.save(
            repo.create({
                resumeId: resume.id,
                companyName: body.company_name,
                position: body.position,
                description: body.description ?? null,
                startDate: dateOnly(body.start_date),
                endDate: body.end_date ? dateOnly(body.end_date) : null,
            }),
        );
        return created(res, `/resumes/${resume.id}/experiences/${saved.id}`, experienceView(saved));
    }

    @Patch('/:resumeId/experiences/:experienceId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Редактирование места работы', ...AUTH })
    async updateExperience(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Param('experienceId') experienceId: string,
        @Body({ type: UpdateExperienceDto }) body: UpdateExperienceDto,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        const repo = dataSource.getRepository(ResumeExperience);
        const exp = await repo.findOneBy({
            id: uuidParam(experienceId, 'EXPERIENCE_NOT_FOUND'),
            resumeId: resume.id,
        });
        if (!exp) throw fail('EXPERIENCE_NOT_FOUND');

        if (body.company_name !== undefined) exp.companyName = body.company_name;
        if (body.position !== undefined) exp.position = body.position;
        if (body.description !== undefined) exp.description = body.description;
        if (body.start_date !== undefined) exp.startDate = dateOnly(body.start_date);
        if (body.end_date !== undefined) exp.endDate = body.end_date ? dateOnly(body.end_date) : null;
        checkDates(exp.startDate, exp.endDate);

        return experienceView(await repo.save(exp));
    }

    @Delete('/:resumeId/experiences/:experienceId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Удаление места работы', ...AUTH })
    async removeExperience(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Param('experienceId') experienceId: string,
        @Res() res: Response,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        const repo = dataSource.getRepository(ResumeExperience);
        const exp = await repo.findOneBy({
            id: uuidParam(experienceId, 'EXPERIENCE_NOT_FOUND'),
            resumeId: resume.id,
        });
        if (!exp) throw fail('EXPERIENCE_NOT_FOUND');
        await repo.delete(exp.id);
        return noContent(res);
    }

    // ---------- образование ----------

    @Post('/:resumeId/educations')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Добавление образования', ...AUTH })
    async addEducation(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Body({ type: CreateEducationDto }) body: CreateEducationDto,
        @Res() res: Response,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        checkYears(body.start_year, body.end_year);

        const repo = dataSource.getRepository(ResumeEducation);
        const saved = await repo.save(
            repo.create({
                resumeId: resume.id,
                institution: body.institution,
                degree: body.degree ?? null,
                fieldOfStudy: body.field_of_study ?? null,
                startYear: body.start_year,
                endYear: body.end_year ?? null,
            }),
        );
        return created(res, `/resumes/${resume.id}/educations/${saved.id}`, educationView(saved));
    }

    @Patch('/:resumeId/educations/:educationId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Редактирование образования', ...AUTH })
    async updateEducation(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Param('educationId') educationId: string,
        @Body({ type: UpdateEducationDto }) body: UpdateEducationDto,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        const repo = dataSource.getRepository(ResumeEducation);
        const edu = await repo.findOneBy({
            id: uuidParam(educationId, 'EDUCATION_NOT_FOUND'),
            resumeId: resume.id,
        });
        if (!edu) throw fail('EDUCATION_NOT_FOUND');

        if (body.institution !== undefined) edu.institution = body.institution;
        if (body.degree !== undefined) edu.degree = body.degree;
        if (body.field_of_study !== undefined) edu.fieldOfStudy = body.field_of_study;
        if (body.start_year !== undefined) edu.startYear = body.start_year;
        if (body.end_year !== undefined) edu.endYear = body.end_year;
        checkYears(edu.startYear, edu.endYear);

        return educationView(await repo.save(edu));
    }

    @Delete('/:resumeId/educations/:educationId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Удаление образования', ...AUTH })
    async removeEducation(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Param('educationId') educationId: string,
        @Res() res: Response,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        const repo = dataSource.getRepository(ResumeEducation);
        const edu = await repo.findOneBy({
            id: uuidParam(educationId, 'EDUCATION_NOT_FOUND'),
            resumeId: resume.id,
        });
        if (!edu) throw fail('EDUCATION_NOT_FOUND');
        await repo.delete(edu.id);
        return noContent(res);
    }

    // ---------- навыки ----------

    @Put('/:resumeId/skills')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Задание навыков резюме (полная замена набора)', ...AUTH })
    async setSkills(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @Body({ type: SetSkillsDto }) body: SetSkillsDto,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        const skills = await requireSkills(body.skill_ids, 'skill_ids');

        // старый набор удаляется, новый записывается — всё в одной транзакции
        await dataSource.transaction(async (manager) => {
            await manager.delete(ResumeSkill, { resumeId: resume.id });
            if (skills.length > 0) {
                await manager.insert(
                    ResumeSkill,
                    skills.map((s) => ({ resumeId: resume.id, skillId: s.id })),
                );
            }
        });

        return {
            items: skills.map(skillView).sort((a, b) => a.name.localeCompare(b.name)),
        };
    }
}

export default ResumeController;
