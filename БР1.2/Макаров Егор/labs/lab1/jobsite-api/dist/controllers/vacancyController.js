"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVacancy = exports.updateVacancy = exports.createVacancy = exports.getVacancy = exports.listVacancies = void 0;
const typeorm_1 = require("typeorm");
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const employerController_1 = require("./employerController");
const pagination_1 = require("../utils/pagination");
const presenters_1 = require("../presenters");
const loadSkills = async (ids) => {
    if (!ids || ids.length === 0)
        return [];
    const skills = await repos_1.repos.skill().findBy({ id: (0, typeorm_1.In)(ids) });
    if (skills.length !== new Set(ids).size) {
        throw httpError_1.HttpError.validation('Некоторые навыки не найдены', [
            { field: 'skill_ids', message: 'Передан несуществующий skill_id' },
        ]);
    }
    return skills;
};
const listVacancies = async (req, res) => {
    const { page, limit, skip, take } = (0, pagination_1.getPageParams)(req.query);
    const q = req.query;
    const qb = repos_1.repos.vacancy().createQueryBuilder('v')
        .leftJoinAndSelect('v.company', 'company')
        .leftJoinAndSelect('company.industry', 'industry');
    if (q.q)
        qb.andWhere('(v.title ILIKE :q OR v.description ILIKE :q)', { q: `%${q.q}%` });
    if (q.industry_id)
        qb.andWhere('company.industry_id = :ind', { ind: Number(q.industry_id) });
    if (q.salary_from)
        qb.andWhere('v.salary_from >= :sf', { sf: Number(q.salary_from) });
    if (q.salary_to)
        qb.andWhere('v.salary_to <= :st', { st: Number(q.salary_to) });
    if (q.experience_years)
        qb.andWhere('v.experience_years <= :exp', { exp: Number(q.experience_years) });
    if (q.employment_type)
        qb.andWhere('v.employment_type = :et', { et: q.employment_type });
    if (q.schedule)
        qb.andWhere('v.schedule = :sch', { sch: q.schedule });
    if (q.city)
        qb.andWhere('v.city ILIKE :city', { city: `%${q.city}%` });
    if (q.company_id)
        qb.andWhere('v.company_id = :cid', { cid: Number(q.company_id) });
    if (q.skill_ids) {
        const ids = Array.isArray(q.skill_ids) ? q.skill_ids.map(Number) : [Number(q.skill_ids)];
        qb.andWhere((sub) => {
            const s = sub.subQuery()
                .select('vs.vacancy_id')
                .from('vacancy_skills', 'vs')
                .where('vs.skill_id IN (:...ids)')
                .getQuery();
            return `v.id IN ${s}`;
        }).setParameter('ids', ids);
    }
    const sort = String(q.sort || '-created_at');
    const sortMap = {
        'created_at': ['v.created_at', 'ASC'],
        '-created_at': ['v.created_at', 'DESC'],
        'salary_from': ['v.salary_from', 'ASC'],
        '-salary_from': ['v.salary_from', 'DESC'],
    };
    const [col, dir] = sortMap[sort] || sortMap['-created_at'];
    qb.orderBy(col, dir).offset(skip).limit(take);
    const [items, total] = await qb.getManyAndCount();
    res.json({ data: items.map(presenters_1.presentVacancy), meta: (0, pagination_1.buildMeta)(page, limit, total) });
};
exports.listVacancies = listVacancies;
const getVacancy = async (req, res) => {
    const vacancy = await repos_1.repos.vacancy().findOne({
        where: { id: Number(req.params.vacancyId) },
        relations: ['company', 'company.industry', 'skills'],
    });
    if (!vacancy)
        throw httpError_1.HttpError.notFound('Вакансия не найдена');
    res.json((0, presenters_1.presentVacancyDetail)(vacancy));
};
exports.getVacancy = getVacancy;
const assertVacancyAccess = async (userId, vacancy) => {
    const employer = await (0, employerController_1.currentEmployer)(userId);
    if (!employer.companyId || employer.companyId !== vacancy.companyId) {
        throw httpError_1.HttpError.forbidden('Вакансия принадлежит другой компании');
    }
};
const createVacancy = async (req, res) => {
    const employer = await (0, employerController_1.currentEmployer)(req.user.id);
    const b = req.body;
    if (employer.companyId !== b.company_id) {
        throw httpError_1.HttpError.forbidden('Можно создавать вакансии только для своей компании');
    }
    const vacancy = repos_1.repos.vacancy().create({
        companyId: b.company_id,
        employerId: employer.id,
        title: b.title,
        description: b.description ?? null,
        requirements: b.requirements ?? null,
        salaryFrom: b.salary_from ?? null,
        salaryTo: b.salary_to ?? null,
        currency: b.currency ?? 'RUB',
        experienceYears: b.experience_years ?? null,
        employmentType: b.employment_type ?? null,
        schedule: b.schedule ?? null,
        city: b.city ?? null,
        status: b.status ?? undefined,
        skills: await loadSkills(b.skill_ids),
    });
    await repos_1.repos.vacancy().save(vacancy);
    const reloaded = await repos_1.repos.vacancy().findOne({
        where: { id: vacancy.id }, relations: ['company', 'company.industry', 'skills'],
    });
    res.status(201).json((0, presenters_1.presentVacancyDetail)(reloaded));
};
exports.createVacancy = createVacancy;
const updateVacancy = async (req, res) => {
    const id = Number(req.params.vacancyId);
    const vacancy = await repos_1.repos.vacancy().findOne({ where: { id }, relations: ['skills'] });
    if (!vacancy)
        throw httpError_1.HttpError.notFound('Вакансия не найдена');
    await assertVacancyAccess(req.user.id, vacancy);
    const b = req.body;
    vacancy.companyId = b.company_id;
    vacancy.title = b.title;
    vacancy.description = b.description ?? null;
    vacancy.requirements = b.requirements ?? null;
    vacancy.salaryFrom = b.salary_from ?? null;
    vacancy.salaryTo = b.salary_to ?? null;
    if (b.currency)
        vacancy.currency = b.currency;
    vacancy.experienceYears = b.experience_years ?? null;
    vacancy.employmentType = b.employment_type ?? null;
    vacancy.schedule = b.schedule ?? null;
    vacancy.city = b.city ?? null;
    if (b.status)
        vacancy.status = b.status;
    if (b.skill_ids)
        vacancy.skills = await loadSkills(b.skill_ids);
    await repos_1.repos.vacancy().save(vacancy);
    const reloaded = await repos_1.repos.vacancy().findOne({
        where: { id }, relations: ['company', 'company.industry', 'skills'],
    });
    res.json((0, presenters_1.presentVacancyDetail)(reloaded));
};
exports.updateVacancy = updateVacancy;
const deleteVacancy = async (req, res) => {
    const id = Number(req.params.vacancyId);
    const vacancy = await repos_1.repos.vacancy().findOne({ where: { id } });
    if (!vacancy)
        throw httpError_1.HttpError.notFound('Вакансия не найдена');
    await assertVacancyAccess(req.user.id, vacancy);
    await repos_1.repos.vacancy().delete({ id });
    res.status(204).send();
};
exports.deleteVacancy = deleteVacancy;
//# sourceMappingURL=vacancyController.js.map