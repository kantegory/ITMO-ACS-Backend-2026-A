"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCompany = exports.updateCompany = exports.createCompany = exports.getCompany = exports.listCompanies = void 0;
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const employerController_1 = require("./employerController");
const pagination_1 = require("../utils/pagination");
const presenters_1 = require("../presenters");
const listCompanies = async (req, res) => {
    const { page, limit, skip, take } = (0, pagination_1.getPageParams)(req.query);
    const qb = repos_1.repos.company().createQueryBuilder('c').leftJoinAndSelect('c.industry', 'industry');
    if (req.query.industry_id)
        qb.andWhere('c.industry_id = :ind', { ind: Number(req.query.industry_id) });
    if (req.query.city)
        qb.andWhere('c.city ILIKE :city', { city: `%${req.query.city}%` });
    if (req.query.size)
        qb.andWhere('c.size = :size', { size: req.query.size });
    qb.orderBy('c.created_at', 'DESC').offset(skip).limit(take);
    const [items, total] = await qb.getManyAndCount();
    res.json({ data: items.map(presenters_1.presentCompany), meta: (0, pagination_1.buildMeta)(page, limit, total) });
};
exports.listCompanies = listCompanies;
const getCompany = async (req, res) => {
    const company = await repos_1.repos.company().findOne({
        where: { id: Number(req.params.companyId) },
        relations: ['industry'],
    });
    if (!company)
        throw httpError_1.HttpError.notFound('Компания не найдена');
    res.json((0, presenters_1.presentCompany)(company));
};
exports.getCompany = getCompany;
const createCompany = async (req, res) => {
    const employer = await (0, employerController_1.currentEmployer)(req.user.id);
    const b = req.body;
    const company = repos_1.repos.company().create({
        name: b.name,
        description: b.description ?? null,
        logoUrl: b.logo_url ?? null,
        website: b.website ?? null,
        industryId: b.industry_id ?? null,
        size: b.size ?? null,
        city: b.city ?? null,
    });
    await repos_1.repos.company().save(company);
    // привязываем создателя к компании, если он ещё не привязан
    if (!employer.companyId) {
        employer.companyId = company.id;
        await repos_1.repos.employer().save(employer);
    }
    const reloaded = await repos_1.repos.company().findOne({ where: { id: company.id }, relations: ['industry'] });
    res.status(201).json((0, presenters_1.presentCompany)(reloaded));
};
exports.createCompany = createCompany;
// проверяет, что текущий работодатель принадлежит компании
const assertCompanyAccess = async (userId, companyId) => {
    const employer = await (0, employerController_1.currentEmployer)(userId);
    if (employer.companyId !== companyId) {
        throw httpError_1.HttpError.forbidden('Вы не относитесь к этой компании');
    }
};
const updateCompany = async (req, res) => {
    const id = Number(req.params.companyId);
    const company = await repos_1.repos.company().findOne({ where: { id } });
    if (!company)
        throw httpError_1.HttpError.notFound('Компания не найдена');
    await assertCompanyAccess(req.user.id, id);
    const b = req.body;
    company.name = b.name;
    company.description = b.description ?? null;
    company.logoUrl = b.logo_url ?? null;
    company.website = b.website ?? null;
    company.industryId = b.industry_id ?? null;
    company.size = b.size ?? null;
    company.city = b.city ?? null;
    await repos_1.repos.company().save(company);
    const reloaded = await repos_1.repos.company().findOne({ where: { id }, relations: ['industry'] });
    res.json((0, presenters_1.presentCompany)(reloaded));
};
exports.updateCompany = updateCompany;
const deleteCompany = async (req, res) => {
    const id = Number(req.params.companyId);
    const company = await repos_1.repos.company().findOne({ where: { id } });
    if (!company)
        throw httpError_1.HttpError.notFound('Компания не найдена');
    await assertCompanyAccess(req.user.id, id);
    await repos_1.repos.company().delete({ id });
    res.status(204).send();
};
exports.deleteCompany = deleteCompany;
//# sourceMappingURL=companyController.js.map