import { Body, Delete, Get, JsonController, Param, Patch, Post, Put, QueryParams, Req, Res, UseBefore } from 'routing-controllers';
import { Response } from 'express';
import { created, dispatchSoon, fail, getClient, invalid, noContent, pageOptions, paginate, publishEvent, Role, UpstreamError, uuidParam } from '@jobsearch/common';

import { dataSource } from '../db';
import { CreateEducationDto, CreateExperienceDto, CreateResumeDto, MyResumesQuery, SetSkillsDto, UpdateEducationDto, UpdateExperienceDto, UpdateResumeDto } from '../dto/resume.dto';
import { authMiddleware, requireRole, RequestWithUser } from '../auth';
import { Resume } from '../models/resume.entity';
import { ResumeEducation } from '../models/resume-education.entity';
import { ResumeExperience } from '../models/resume-experience.entity';
import { ResumeSkill } from '../models/resume-skill.entity';
import { assemble, checkSalaryRange, educationView, emitResumeUpsert, experienceView, loadOwnedResume, requireIndustry, requireSkills, shortView, touch } from '../support';

const JOBSEEKER = [authMiddleware, requireRole(Role.JOBSEEKER)];
const dateOnly = (v: string) => v.slice(0, 10);
const checkDates = (start: string, end: string | null | undefined) => {
    if (end && dateOnly(end) < dateOnly(start)) throw invalid('end_date', 'Дата окончания не может быть раньше даты начала');
};
const checkYears = (start: number, end: number | null | undefined) => {
    if (end != null && end < start) throw invalid('end_year', 'Год окончания не может быть меньше года начала');
};

@JsonController('/api/v1/resumes')
class ResumeController {
    private resumes = () => dataSource.getRepository(Resume);
    private detail = async (id: string) => (await assemble([await this.resumes().findOneByOrFail({ id })], true))[0];

    @Get('')
    @UseBefore(...JOBSEEKER)
    async list(@Req() req: RequestWithUser, @QueryParams({ type: MyResumesQuery }) query: MyResumesQuery) {
        const [list, total] = await this.resumes().findAndCount({
            where: { userId: req.user!.id, ...(query.is_published !== undefined ? { isPublished: query.is_published } : {}) },
            order: { updatedAt: 'DESC' }, ...pageOptions(query),
        });
        return paginate((await assemble(list, false)).map(shortView), query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...JOBSEEKER)
    async create(@Req() req: RequestWithUser, @Body({ type: CreateResumeDto }) body: CreateResumeDto, @Res() res: Response) {
        await requireIndustry(body.industry_id);
        checkSalaryRange(body.salary_exp_from, body.salary_exp_to, 'salary_exp_from');
        const id = await dataSource.transaction(async (m) => {
            const saved = await m.save(m.create(Resume, {
                userId: req.user!.id, industryId: body.industry_id, title: body.title, summary: body.summary ?? null,
                salaryExpFrom: body.salary_exp_from ?? null, salaryExpTo: body.salary_exp_to ?? null, isPublished: body.is_published ?? false,
            }));
            await emitResumeUpsert(m, saved.id);
            return saved.id;
        });
        dispatchSoon();
        return created(res, `/resumes/${id}`, await this.detail(id));
    }

    @Get('/:resumeId')
    @UseBefore(authMiddleware)
    async get(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string) {
        const r = await this.resumes().findOneBy({ id: uuidParam(resumeId, 'RESUME_NOT_FOUND') });
        if (!r) throw fail('RESUME_NOT_FOUND');
        if (r.userId !== req.user!.id) {
            // работодатель видит резюме только из откликов на его вакансии: спрашиваем Application Service
            let allowed = false;
            if (req.user!.role === Role.EMPLOYER) {
                const res: any = await getClient().call('application-service', 'GET', '/internal/v1/applications/access-check', { query: { resume_id: r.id, employer_user_id: req.user!.id } });
                allowed = !!res.allowed;
            }
            if (!allowed) throw fail('FORBIDDEN');
        }
        return this.detail(r.id);
    }

    @Patch('/:resumeId')
    @UseBefore(...JOBSEEKER)
    async update(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Body({ type: UpdateResumeDto }) body: UpdateResumeDto) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        if (body.industry_id !== undefined) await requireIndustry(body.industry_id);
        checkSalaryRange(body.salary_exp_from !== undefined ? body.salary_exp_from : r.salaryExpFrom, body.salary_exp_to !== undefined ? body.salary_exp_to : r.salaryExpTo, 'salary_exp_from');
        if (body.title !== undefined) r.title = body.title;
        if (body.summary !== undefined) r.summary = body.summary;
        if (body.industry_id !== undefined) r.industryId = body.industry_id;
        if (body.salary_exp_from !== undefined) r.salaryExpFrom = body.salary_exp_from;
        if (body.salary_exp_to !== undefined) r.salaryExpTo = body.salary_exp_to;
        if (body.is_published !== undefined) r.isPublished = body.is_published;
        await dataSource.transaction(async (m) => { await m.save(Resume, r); await emitResumeUpsert(m, r.id); });
        dispatchSoon();
        return this.detail(r.id);
    }

    @Delete('/:resumeId')
    @UseBefore(...JOBSEEKER)
    async remove(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Res() res: Response) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        let exists: { exists: boolean };
        try {
            exists = await getClient().call('application-service', 'GET', '/internal/v1/applications/exists', { query: { resume_id: r.id } });
        } catch (e) { throw e instanceof UpstreamError ? fail('INTERNAL_ERROR') : e; }
        if (exists.exists) throw fail('RESUME_HAS_APPLICATIONS');
        await dataSource.transaction(async (m) => {
            await m.delete(Resume, { id: r.id });
            await publishEvent(m, 'resume.deleted', { resume_id: r.id, deleted_at: new Date().toISOString() });
        });
        dispatchSoon();
        return noContent(res);
    }

    // ---------- опыт работы ----------
    @Post('/:resumeId/experiences')
    @UseBefore(...JOBSEEKER)
    async addExperience(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Body({ type: CreateExperienceDto }) body: CreateExperienceDto, @Res() res: Response) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        checkDates(body.start_date, body.end_date);
        const saved = await dataSource.transaction(async (m) => {
            const e = await m.save(m.create(ResumeExperience, {
                resumeId: r.id, companyName: body.company_name, position: body.position, description: body.description ?? null,
                startDate: dateOnly(body.start_date), endDate: body.end_date ? dateOnly(body.end_date) : null,
            }));
            await touch(m, r.id); await emitResumeUpsert(m, r.id);
            return e;
        });
        dispatchSoon();
        return created(res, `/resumes/${r.id}/experiences/${saved.id}`, experienceView(saved));
    }

    @Patch('/:resumeId/experiences/:experienceId')
    @UseBefore(...JOBSEEKER)
    async updateExperience(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Param('experienceId') experienceId: string, @Body({ type: UpdateExperienceDto }) body: UpdateExperienceDto) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        const e = await dataSource.getRepository(ResumeExperience).findOneBy({ id: uuidParam(experienceId, 'EXPERIENCE_NOT_FOUND'), resumeId: r.id });
        if (!e) throw fail('EXPERIENCE_NOT_FOUND');
        if (body.company_name !== undefined) e.companyName = body.company_name;
        if (body.position !== undefined) e.position = body.position;
        if (body.description !== undefined) e.description = body.description;
        if (body.start_date !== undefined) e.startDate = dateOnly(body.start_date);
        if (body.end_date !== undefined) e.endDate = body.end_date ? dateOnly(body.end_date) : null;
        checkDates(e.startDate, e.endDate);
        await dataSource.transaction(async (m) => { await m.save(ResumeExperience, e); await touch(m, r.id); await emitResumeUpsert(m, r.id); });
        dispatchSoon();
        return experienceView(e);
    }

    @Delete('/:resumeId/experiences/:experienceId')
    @UseBefore(...JOBSEEKER)
    async removeExperience(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Param('experienceId') experienceId: string, @Res() res: Response) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        const e = await dataSource.getRepository(ResumeExperience).findOneBy({ id: uuidParam(experienceId, 'EXPERIENCE_NOT_FOUND'), resumeId: r.id });
        if (!e) throw fail('EXPERIENCE_NOT_FOUND');
        await dataSource.transaction(async (m) => { await m.delete(ResumeExperience, { id: e.id }); await touch(m, r.id); await emitResumeUpsert(m, r.id); });
        dispatchSoon();
        return noContent(res);
    }

    // ---------- образование ----------
    @Post('/:resumeId/educations')
    @UseBefore(...JOBSEEKER)
    async addEducation(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Body({ type: CreateEducationDto }) body: CreateEducationDto, @Res() res: Response) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        checkYears(body.start_year, body.end_year);
        const repo = dataSource.getRepository(ResumeEducation);
        const saved = await repo.save(repo.create({ resumeId: r.id, institution: body.institution, degree: body.degree ?? null, fieldOfStudy: body.field_of_study ?? null, startYear: body.start_year, endYear: body.end_year ?? null }));
        return created(res, `/resumes/${r.id}/educations/${saved.id}`, educationView(saved));
    }

    @Patch('/:resumeId/educations/:educationId')
    @UseBefore(...JOBSEEKER)
    async updateEducation(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Param('educationId') educationId: string, @Body({ type: UpdateEducationDto }) body: UpdateEducationDto) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        const repo = dataSource.getRepository(ResumeEducation);
        const e = await repo.findOneBy({ id: uuidParam(educationId, 'EDUCATION_NOT_FOUND'), resumeId: r.id });
        if (!e) throw fail('EDUCATION_NOT_FOUND');
        if (body.institution !== undefined) e.institution = body.institution;
        if (body.degree !== undefined) e.degree = body.degree;
        if (body.field_of_study !== undefined) e.fieldOfStudy = body.field_of_study;
        if (body.start_year !== undefined) e.startYear = body.start_year;
        if (body.end_year !== undefined) e.endYear = body.end_year;
        checkYears(e.startYear, e.endYear);
        return educationView(await repo.save(e));
    }

    @Delete('/:resumeId/educations/:educationId')
    @UseBefore(...JOBSEEKER)
    async removeEducation(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Param('educationId') educationId: string, @Res() res: Response) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        const repo = dataSource.getRepository(ResumeEducation);
        const e = await repo.findOneBy({ id: uuidParam(educationId, 'EDUCATION_NOT_FOUND'), resumeId: r.id });
        if (!e) throw fail('EDUCATION_NOT_FOUND');
        await repo.delete(e.id);
        return noContent(res);
    }

    // ---------- навыки ----------
    @Put('/:resumeId/skills')
    @UseBefore(...JOBSEEKER)
    async setSkills(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @Body({ type: SetSkillsDto }) body: SetSkillsDto) {
        const r = await loadOwnedResume(resumeId, req.user!.id);
        const skills = await requireSkills(body.skill_ids, 'skill_ids');
        await dataSource.transaction(async (m) => {
            await m.delete(ResumeSkill, { resumeId: r.id });
            if (skills.length) await m.insert(ResumeSkill, skills.map((s) => ({ resumeId: r.id, skillId: s.id })));
            await touch(m, r.id); await emitResumeUpsert(m, r.id);
        });
        dispatchSoon();
        return { items: skills.map((s) => ({ id: s.id, name: s.name })).sort((a, b) => a.name.localeCompare(b.name)) };
    }
}
export default ResumeController;
