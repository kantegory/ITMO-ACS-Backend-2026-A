"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSaved = exports.addSaved = exports.listSaved = void 0;
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const seekerController_1 = require("./seekerController");
const pagination_1 = require("../utils/pagination");
const presenters_1 = require("../presenters");
const listSaved = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const { page, limit, skip, take } = (0, pagination_1.getPageParams)(req.query);
    const [items, total] = await repos_1.repos.savedVacancy().findAndCount({
        where: { jobSeekerId: seeker.id },
        relations: ['vacancy'],
        skip, take,
        order: { createdAt: 'DESC' },
    });
    res.json({ data: items.map((s) => (0, presenters_1.presentVacancy)(s.vacancy)), meta: (0, pagination_1.buildMeta)(page, limit, total) });
};
exports.listSaved = listSaved;
const addSaved = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const vacancyId = Number(req.body.vacancy_id);
    const vacancy = await repos_1.repos.vacancy().findOne({ where: { id: vacancyId } });
    if (!vacancy)
        throw httpError_1.HttpError.notFound('Вакансия не найдена');
    const dup = await repos_1.repos.savedVacancy().findOne({ where: { jobSeekerId: seeker.id, vacancyId } });
    if (dup)
        throw httpError_1.HttpError.conflict('Вакансия уже в избранном');
    const saved = repos_1.repos.savedVacancy().create({ jobSeekerId: seeker.id, vacancyId });
    await repos_1.repos.savedVacancy().save(saved);
    res.status(201).json({ job_seeker_id: seeker.id, vacancy_id: vacancyId });
};
exports.addSaved = addSaved;
const removeSaved = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const vacancyId = Number(req.params.vacancyId);
    const saved = await repos_1.repos.savedVacancy().findOne({ where: { jobSeekerId: seeker.id, vacancyId } });
    if (!saved)
        throw httpError_1.HttpError.notFound('Вакансия не найдена в избранном');
    await repos_1.repos.savedVacancy().delete({ jobSeekerId: seeker.id, vacancyId });
    res.status(204).send();
};
exports.removeSaved = removeSaved;
//# sourceMappingURL=savedVacancyController.js.map