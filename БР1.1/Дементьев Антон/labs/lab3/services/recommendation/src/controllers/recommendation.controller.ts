import { Get, JsonController, Param, QueryParams, Req, UseBefore } from 'routing-controllers';
import { In } from 'typeorm';
import { applicantShort, fail, getResume, getVacancy, lookupResumes, lookupUsers, lookupVacancies, resumeShort, Role, uuidParam, vacancyShort } from '@jobsearch/common';

import { dataSource } from '../db';
import { RecommendationQuery } from '../dto/recommendation.dto';
import { authMiddleware, requireRole, RequestWithUser } from '../auth';
import { ResumeIndex, ResumeSkillIndex, VacancyIndex, VacancySkillIndex } from '../models/index.entities';
import { monthsBetween, score } from '../scoring';

const CANDIDATES_LIMIT = 500;
const byName = (a: any, b: any) => a.name.localeCompare(b.name);

@JsonController('/api/v1')
class RecommendationController {
    // №48: вакансии для резюме
    @Get('/resumes/:resumeId/recommended-vacancies')
    @UseBefore(authMiddleware, requireRole(Role.JOBSEEKER))
    async vacanciesForResume(@Req() req: RequestWithUser, @Param('resumeId') resumeId: string, @QueryParams({ type: RecommendationQuery }) query: RecommendationQuery) {
        const resume = await getResume(uuidParam(resumeId, 'RESUME_NOT_FOUND'));
        if (resume.user_id !== req.user!.id) throw fail('FORBIDDEN');
        const rIds = new Set<string>(resume.skills.map((s: any) => s.id));
        const rctx = { industryId: resume.industry.id, salaryFrom: resume.salary_exp_from, salaryTo: resume.salary_exp_to, skillIds: rIds, experienceMonths: resume.total_experience_months };

        const cands = await dataSource.getRepository(VacancyIndex).find({ where: { isActive: true }, order: { sourceCreatedAt: 'DESC' }, take: CANDIDATES_LIMIT });
        const skills = cands.length ? await dataSource.getRepository(VacancySkillIndex).find({ where: { vacancyId: In(cands.map((c) => c.vacancyId)) } }) : [];
        const scored = cands.map((c) => {
            const sk = skills.filter((s) => s.vacancyId === c.vacancyId);
            return { id: c.vacancyId, match: score(rctx, { industryId: c.industryId, salaryFrom: c.salaryFrom, salaryTo: c.salaryTo, minExperienceYears: c.minExperienceYears,
                required: sk.filter((s) => s.isRequired).map((s) => s.skillId), optional: sk.filter((s) => !s.isRequired).map((s) => s.skillId) }) };
        }).sort((a, b) => b.match - a.match).slice(0, query.limit);

        const vm = await lookupVacancies(scored.map((s) => s.id));
        const items = scored.filter((s) => vm.has(s.id)).map((s) => {
            const v = vm.get(s.id);
            const req_ = v.skills.filter((x: any) => x.is_required).map((x: any) => x.skill);
            const opt = v.skills.filter((x: any) => !x.is_required).map((x: any) => x.skill);
            return {
                vacancy: vacancyShort(v), match_score: s.match,
                matched_skills: [...req_, ...opt].filter((x: any) => rIds.has(x.id)).sort(byName),
                missing_required_skills: req_.filter((x: any) => !rIds.has(x.id)).sort(byName),
            };
        });
        return { items };
    }

    // №49: кандидаты для вакансии (контакты не раскрываются)
    @Get('/vacancies/:vacancyId/recommended-resumes')
    @UseBefore(authMiddleware, requireRole(Role.EMPLOYER))
    async resumesForVacancy(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @QueryParams({ type: RecommendationQuery }) query: RecommendationQuery) {
        const v = await getVacancy(uuidParam(vacancyId, 'VACANCY_NOT_FOUND'));
        if (v.company.owner_user_id !== req.user!.id) throw fail('FORBIDDEN');
        const reqSk = v.skills.filter((x: any) => x.is_required).map((x: any) => x.skill);
        const optSk = v.skills.filter((x: any) => !x.is_required).map((x: any) => x.skill);
        const vctx = { industryId: v.industry.id, salaryFrom: v.salary_from, salaryTo: v.salary_to, minExperienceYears: v.min_experience_years,
            required: reqSk.map((s: any) => s.id), optional: optSk.map((s: any) => s.id) };

        const cands = await dataSource.getRepository(ResumeIndex).find({ order: { sourceUpdatedAt: 'DESC' }, take: CANDIDATES_LIMIT });
        const skills = cands.length ? await dataSource.getRepository(ResumeSkillIndex).find({ where: { resumeId: In(cands.map((c) => c.resumeId)) } }) : [];
        const scored = cands.map((c) => {
            const ids = new Set(skills.filter((s) => s.resumeId === c.resumeId).map((s) => s.skillId));
            const months = (c.experiencePeriods || []).reduce((sum, p) => sum + monthsBetween(p.start_date, p.end_date), 0);
            return { id: c.resumeId, userId: c.userId, ids, match: score({ industryId: c.industryId, salaryFrom: c.salaryExpFrom, salaryTo: c.salaryExpTo, skillIds: ids, experienceMonths: months }, vctx) };
        }).sort((a, b) => b.match - a.match).slice(0, query.limit);

        const [rm, um] = await Promise.all([lookupResumes(scored.map((s) => s.id), 'short'), lookupUsers(scored.map((s) => s.userId))]);
        const items = scored.filter((s) => rm.has(s.id)).map((s) => ({
            resume: resumeShort(rm.get(s.id)), applicant: applicantShort(s.userId, um.get(s.userId)), match_score: s.match,
            matched_skills: [...reqSk, ...optSk].filter((x: any) => s.ids.has(x.id)).sort(byName),
            missing_required_skills: reqSk.filter((x: any) => !s.ids.has(x.id)).sort(byName),
        }));
        return { items };
    }
}
export default RecommendationController;
