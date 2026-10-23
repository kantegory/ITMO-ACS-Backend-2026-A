import { Get, JsonController, Param, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import dataSource from '../config/data-source';
import { RecommendationQuery } from '../dto/recommendation.dto';
import authMiddleware, { requireRole, RequestWithUser } from '../middlewares/auth.middleware';
import { Role } from '../models/enums';
import { Resume } from '../models/resume.entity';
import { Vacancy } from '../models/vacancy.entity';
import { loadOwnedResume, loadOwnedVacancy } from '../services/access.service';
import { buildResumeCtxs, buildVacancyCtxs, score } from '../services/recommendation.service';
import { applicantShortView } from '../views/user.view';
import { loadProfiles } from '../views/application.view';
import { buildResumeShorts } from '../views/resume.view';
import { vacancyShortView } from '../views/vacancy.view';

const AUTH = { security: [{ bearerAuth: [] }] };
// сколько последних вакансий / резюме рассматриваем при подборе
const CANDIDATES_LIMIT = 500;

@JsonController()
class RecommendationController {
    @Get('/resumes/:resumeId/recommended-vacancies')
    @UseBefore(authMiddleware, requireRole(Role.JOBSEEKER))
    @OpenAPI({ summary: 'Рекомендованные вакансии для резюме', ...AUTH })
    async vacanciesForResume(
        @Req() req: RequestWithUser,
        @Param('resumeId') resumeId: string,
        @QueryParams({ type: RecommendationQuery }) query: RecommendationQuery,
    ) {
        const resume = await loadOwnedResume(resumeId, req.user!.id);
        const [resumeCtx] = await buildResumeCtxs([resume]);

        const vacancies = await dataSource.getRepository(Vacancy).find({
            where: { isActive: true },
            relations: { company: true, industry: true },
            order: { createdAt: 'DESC' },
            take: CANDIDATES_LIMIT,
        });
        const ctxs = await buildVacancyCtxs(vacancies);

        const items = ctxs
            .map((v) => ({ vacancy: vacancyShortView(v.vacancy), ...score(resumeCtx, v) }))
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, query.limit);
        return { items };
    }

    @Get('/vacancies/:vacancyId/recommended-resumes')
    @UseBefore(authMiddleware, requireRole(Role.EMPLOYER))
    @OpenAPI({ summary: 'Рекомендованные кандидаты для вакансии', ...AUTH })
    async resumesForVacancy(
        @Req() req: RequestWithUser,
        @Param('vacancyId') vacancyId: string,
        @QueryParams({ type: RecommendationQuery }) query: RecommendationQuery,
    ) {
        const vacancy = await loadOwnedVacancy(vacancyId, req.user!.id);
        const [vacancyCtx] = await buildVacancyCtxs([vacancy]);

        const resumes = await dataSource.getRepository(Resume).find({
            where: { isPublished: true },
            relations: { industry: true },
            order: { updatedAt: 'DESC' },
            take: CANDIDATES_LIMIT,
        });
        const [ctxs, shorts, profiles] = await Promise.all([
            buildResumeCtxs(resumes),
            buildResumeShorts(resumes),
            loadProfiles(resumes.map((r) => r.userId)),
        ]);
        const shortById = new Map(shorts.map((s) => [s.id, s]));

        // контакты кандидатов не раскрываются: только имя
        const items = ctxs
            .map((c) => ({
                resume: shortById.get(c.resume.id),
                applicant: applicantShortView(c.resume.userId, profiles.get(c.resume.userId)),
                ...score(c, vacancyCtx),
            }))
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, query.limit);
        return { items };
    }
}

export default RecommendationController;
