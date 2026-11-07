"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteApplication = exports.updateApplicationStatus = exports.getApplication = exports.listMyApplications = exports.listVacancyApplications = exports.createApplication = void 0;
const typeorm_1 = require("typeorm");
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const seekerController_1 = require("./seekerController");
const employerController_1 = require("./employerController");
const pagination_1 = require("../utils/pagination");
const presenters_1 = require("../presenters");
const enums_1 = require("../entities/enums");
const createApplication = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const vacancyId = Number(req.params.vacancyId);
    const { resume_id, cover_letter } = req.body;
    const vacancy = await repos_1.repos.vacancy().findOne({ where: { id: vacancyId } });
    if (!vacancy)
        throw httpError_1.HttpError.notFound('Вакансия не найдена');
    const resume = await repos_1.repos.resume().findOne({ where: { id: resume_id } });
    if (!resume)
        throw httpError_1.HttpError.notFound('Резюме не найдено');
    if (resume.jobSeekerId !== seeker.id)
        throw httpError_1.HttpError.forbidden('Это не ваше резюме');
    const dup = await repos_1.repos.application().findOne({ where: { vacancyId, resumeId: resume_id } });
    if (dup)
        throw httpError_1.HttpError.conflict('Отклик этим резюме на данную вакансию уже существует');
    const application = repos_1.repos.application().create({
        vacancyId,
        resumeId: resume_id,
        coverLetter: cover_letter ?? null,
    });
    await repos_1.repos.application().save(application);
    res.status(201).json((0, presenters_1.presentApplication)(application));
};
exports.createApplication = createApplication;
const listVacancyApplications = async (req, res) => {
    const vacancyId = Number(req.params.vacancyId);
    const vacancy = await repos_1.repos.vacancy().findOne({ where: { id: vacancyId } });
    if (!vacancy)
        throw httpError_1.HttpError.notFound('Вакансия не найдена');
    const employer = await (0, employerController_1.currentEmployer)(req.user.id);
    if (employer.companyId !== vacancy.companyId) {
        throw httpError_1.HttpError.forbidden('Вакансия принадлежит другой компании');
    }
    const { page, limit, skip, take } = (0, pagination_1.getPageParams)(req.query);
    const where = { vacancyId };
    if (req.query.status)
        where.status = req.query.status;
    const [items, total] = await repos_1.repos.application().findAndCount({
        where, skip, take, order: { createdAt: 'DESC' },
    });
    res.json({ data: items.map(presenters_1.presentApplication), meta: (0, pagination_1.buildMeta)(page, limit, total) });
};
exports.listVacancyApplications = listVacancyApplications;
const listMyApplications = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const resumes = await repos_1.repos.resume().find({ where: { jobSeekerId: seeker.id } });
    const resumeIds = resumes.map((r) => r.id);
    const { page, limit, skip, take } = (0, pagination_1.getPageParams)(req.query);
    if (resumeIds.length === 0) {
        res.json({ data: [], meta: (0, pagination_1.buildMeta)(page, limit, 0) });
        return;
    }
    const where = { resumeId: (0, typeorm_1.In)(resumeIds) };
    if (req.query.status)
        where.status = req.query.status;
    const [items, total] = await repos_1.repos.application().findAndCount({
        where, skip, take, order: { createdAt: 'DESC' },
    });
    res.json({ data: items.map(presenters_1.presentApplication), meta: (0, pagination_1.buildMeta)(page, limit, total) });
};
exports.listMyApplications = listMyApplications;
// проверяет доступ к отклику: владелец-резюме (соискатель) или работодатель компании-вакансии
const loadAccessibleApplication = async (req) => {
    const application = await repos_1.repos.application().findOne({
        where: { id: Number(req.params.applicationId) },
        relations: ['vacancy', 'resume'],
    });
    if (!application)
        throw httpError_1.HttpError.notFound('Отклик не найден');
    if (req.user.role === enums_1.UserRole.SEEKER) {
        const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
        if (application.resume.jobSeekerId !== seeker.id)
            throw httpError_1.HttpError.forbidden();
    }
    else {
        const employer = await (0, employerController_1.currentEmployer)(req.user.id);
        if (employer.companyId !== application.vacancy.companyId)
            throw httpError_1.HttpError.forbidden();
    }
    return application;
};
const getApplication = async (req, res) => {
    const application = await loadAccessibleApplication(req);
    res.json((0, presenters_1.presentApplicationDetail)(application));
};
exports.getApplication = getApplication;
const updateApplicationStatus = async (req, res) => {
    const application = await repos_1.repos.application().findOne({
        where: { id: Number(req.params.applicationId) },
        relations: ['vacancy'],
    });
    if (!application)
        throw httpError_1.HttpError.notFound('Отклик не найден');
    const employer = await (0, employerController_1.currentEmployer)(req.user.id);
    if (employer.companyId !== application.vacancy.companyId)
        throw httpError_1.HttpError.forbidden();
    application.status = req.body.status;
    await repos_1.repos.application().save(application);
    res.json((0, presenters_1.presentApplication)(application));
};
exports.updateApplicationStatus = updateApplicationStatus;
const deleteApplication = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const application = await repos_1.repos.application().findOne({
        where: { id: Number(req.params.applicationId) },
        relations: ['resume'],
    });
    if (!application)
        throw httpError_1.HttpError.notFound('Отклик не найден');
    if (application.resume.jobSeekerId !== seeker.id)
        throw httpError_1.HttpError.forbidden();
    await repos_1.repos.application().delete({ id: application.id });
    res.status(204).send();
};
exports.deleteApplication = deleteApplication;
//# sourceMappingURL=applicationController.js.map