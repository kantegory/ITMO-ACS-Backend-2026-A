"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VacancyController = void 0;
const vacancy_service_1 = require("../services/vacancy.service");
const mappers_1 = require("../utils/mappers");
const params_1 = require("../utils/params");
class VacancyController {
    static async listPublic(req, res, next) {
        try {
            const items = await vacancy_service_1.VacancyService.listPublished({
                industry: req.query.industry,
                salaryFrom: req.query.salary_from
                    ? parseInt(req.query.salary_from, 10)
                    : undefined,
                salaryTo: req.query.salary_to
                    ? parseInt(req.query.salary_to, 10)
                    : undefined,
                experienceLevel: req.query.experience_level,
                location: req.query.location,
                employmentType: req.query.employment_type,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
            });
            res.json({ items: items.map(mappers_1.toVacancy) });
        }
        catch (e) {
            next(e);
        }
    }
    static async getPublic(req, res, next) {
        try {
            const { vacancy, company } = await vacancy_service_1.VacancyService.getPublishedDetails((0, params_1.routeParam)(req.params.id));
            res.json({ vacancy: (0, mappers_1.toVacancy)(vacancy), company: (0, mappers_1.toCompany)(company) });
        }
        catch (e) {
            next(e);
        }
    }
    static async upsertCompany(req, res, next) {
        try {
            const company = await vacancy_service_1.VacancyService.upsertCompany(req.user.userId, {
                name: req.body.name,
                description: req.body.description,
                website: req.body.website,
                industry: req.body.industry,
            });
            res.json((0, mappers_1.toCompany)(company));
        }
        catch (e) {
            next(e);
        }
    }
    static async employerList(req, res, next) {
        try {
            const items = await vacancy_service_1.VacancyService.employerVacancies(req.user.userId);
            res.json({ items: items.map(mappers_1.toVacancy) });
        }
        catch (e) {
            next(e);
        }
    }
    static async create(req, res, next) {
        try {
            const vacancy = await vacancy_service_1.VacancyService.createVacancy(req.user.userId, {
                title: req.body.title,
                description: req.body.description,
                requirements: req.body.requirements,
                industry: req.body.industry,
                salaryFrom: req.body.salary_from,
                salaryTo: req.body.salary_to,
                experienceLevel: req.body.experience_level,
                location: req.body.location,
                employmentType: req.body.employment_type,
                status: req.body.status,
            });
            res.status(201).json((0, mappers_1.toVacancy)(vacancy));
        }
        catch (e) {
            next(e);
        }
    }
    static async update(req, res, next) {
        try {
            const vacancy = await vacancy_service_1.VacancyService.updateVacancy(req.user.userId, (0, params_1.routeParam)(req.params.id), {
                title: req.body.title,
                description: req.body.description,
                requirements: req.body.requirements,
                industry: req.body.industry,
                salaryFrom: req.body.salary_from,
                salaryTo: req.body.salary_to,
                experienceLevel: req.body.experience_level,
                location: req.body.location,
                employmentType: req.body.employment_type,
                status: req.body.status,
            });
            res.json((0, mappers_1.toVacancy)(vacancy));
        }
        catch (e) {
            next(e);
        }
    }
}
exports.VacancyController = VacancyController;
