"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyService = void 0;
const data_source_1 = require("../data-source");
const Company_1 = require("../entities/Company");
const Vacancy_1 = require("../entities/Vacancy");
const errors_1 = require("../utils/errors");
const companyRepo = () => data_source_1.AppDataSource.getRepository(Company_1.Company);
const vacancyRepo = () => data_source_1.AppDataSource.getRepository(Vacancy_1.Vacancy);
class VacancyService {
    static async listPublished(filter) {
        const limit = Math.min(Math.max(filter.limit || 20, 1), 100);
        const offset = Math.max(filter.offset || 0, 0);
        const qb = vacancyRepo()
            .createQueryBuilder("v")
            .where("v.status = :status", { status: "published" });
        if (filter.industry)
            qb.andWhere("v.industry = :industry", { industry: filter.industry });
        if (filter.experienceLevel) {
            qb.andWhere("v.experience_level = :exp", { exp: filter.experienceLevel });
        }
        if (filter.employmentType) {
            qb.andWhere("v.employment_type = :et", { et: filter.employmentType });
        }
        if (filter.location) {
            qb.andWhere("v.location ILIKE :loc", { loc: `%${filter.location}%` });
        }
        if (filter.salaryFrom != null) {
            qb.andWhere("coalesce(v.salary_to, v.salary_from, 0) >= :sf", { sf: filter.salaryFrom });
        }
        if (filter.salaryTo != null) {
            qb.andWhere("coalesce(v.salary_from, v.salary_to, 0) <= :st", { st: filter.salaryTo });
        }
        return qb.orderBy("v.created_at", "DESC").take(limit).skip(offset).getMany();
    }
    static async getPublishedDetails(id) {
        const vacancy = await vacancyRepo().findOneBy({ id });
        if (!vacancy || vacancy.status !== "published")
            throw (0, errors_1.notFound)();
        const company = await companyRepo().findOneBy({ id: vacancy.companyId });
        if (!company)
            throw (0, errors_1.notFound)();
        return { vacancy, company };
    }
    static async upsertCompany(ownerId, data) {
        let company = await companyRepo().findOne({ where: { ownerId } });
        if (!company) {
            company = companyRepo().create({ ownerId });
        }
        company.name = data.name.trim();
        company.description = data.description?.trim() || null;
        company.website = data.website?.trim() || null;
        company.industry = data.industry.trim();
        return companyRepo().save(company);
    }
    static async employerVacancies(ownerId) {
        const company = await companyRepo().findOne({ where: { ownerId } });
        if (!company)
            throw (0, errors_1.notFound)();
        return vacancyRepo().find({
            where: { companyId: company.id },
            order: { createdAt: "DESC" },
        });
    }
    static async createVacancy(ownerId, data) {
        const company = await companyRepo().findOne({ where: { ownerId } });
        if (!company)
            throw (0, errors_1.notFound)();
        validateSalary(data.salaryFrom, data.salaryTo);
        const vacancy = vacancyRepo().create({
            companyId: company.id,
            title: data.title,
            description: data.description,
            requirements: data.requirements,
            industry: data.industry,
            salaryFrom: data.salaryFrom ?? null,
            salaryTo: data.salaryTo ?? null,
            experienceLevel: data.experienceLevel,
            location: data.location || null,
            employmentType: data.employmentType,
            status: data.status || "draft",
        });
        return vacancyRepo().save(vacancy);
    }
    static async updateVacancy(ownerId, vacancyId, data) {
        const company = await companyRepo().findOne({ where: { ownerId } });
        if (!company)
            throw (0, errors_1.notFound)();
        const vacancy = await vacancyRepo().findOneBy({ id: vacancyId });
        if (!vacancy)
            throw (0, errors_1.notFound)();
        if (vacancy.companyId !== company.id)
            throw (0, errors_1.forbidden)();
        validateSalary(data.salaryFrom ?? vacancy.salaryFrom, data.salaryTo ?? vacancy.salaryTo);
        Object.assign(vacancy, {
            title: data.title ?? vacancy.title,
            description: data.description ?? vacancy.description,
            requirements: data.requirements ?? vacancy.requirements,
            industry: data.industry ?? vacancy.industry,
            salaryFrom: data.salaryFrom !== undefined ? data.salaryFrom : vacancy.salaryFrom,
            salaryTo: data.salaryTo !== undefined ? data.salaryTo : vacancy.salaryTo,
            experienceLevel: data.experienceLevel ?? vacancy.experienceLevel,
            location: data.location !== undefined ? data.location : vacancy.location,
            employmentType: data.employmentType ?? vacancy.employmentType,
            status: data.status ?? vacancy.status,
        });
        return vacancyRepo().save(vacancy);
    }
}
exports.VacancyService = VacancyService;
function validateSalary(from, to) {
    if (from != null && to != null && from > to)
        throw (0, errors_1.badRequest)();
}
