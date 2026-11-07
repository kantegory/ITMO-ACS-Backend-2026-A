"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEducation = exports.updateEducation = exports.createEducation = exports.listEducations = exports.deleteWorkExperience = exports.updateWorkExperience = exports.createWorkExperience = exports.listWorkExperiences = exports.setResumeSkills = exports.deleteResume = exports.updateResume = exports.getResume = exports.createResume = exports.listResumes = void 0;
const typeorm_1 = require("typeorm");
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const seekerController_1 = require("./seekerController");
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
// проверяет, что резюме принадлежит текущему соискателю
const ownedResume = async (userId, resumeId, relations = []) => {
    const resume = await repos_1.repos.resume().findOne({ where: { id: resumeId }, relations });
    if (!resume)
        throw httpError_1.HttpError.notFound('Резюме не найдено');
    const seeker = await (0, seekerController_1.currentSeeker)(userId);
    if (resume.jobSeekerId !== seeker.id)
        throw httpError_1.HttpError.forbidden('Это не ваше резюме');
    return resume;
};
const listResumes = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const { page, limit, skip, take } = (0, pagination_1.getPageParams)(req.query);
    const where = { jobSeekerId: seeker.id };
    if (req.query.status)
        where.status = req.query.status;
    const [items, total] = await repos_1.repos.resume().findAndCount({
        where, skip, take, order: { createdAt: 'DESC' },
    });
    res.json({ data: items.map(presenters_1.presentResume), meta: (0, pagination_1.buildMeta)(page, limit, total) });
};
exports.listResumes = listResumes;
const createResume = async (req, res) => {
    const seeker = await (0, seekerController_1.currentSeeker)(req.user.id);
    const b = req.body;
    const resume = repos_1.repos.resume().create({
        jobSeekerId: seeker.id,
        title: b.title,
        salaryExpected: b.salary_expected ?? null,
        currency: b.currency ?? 'RUB',
        employmentType: b.employment_type ?? null,
        schedule: b.schedule ?? null,
        status: b.status ?? undefined,
        skills: await loadSkills(b.skill_ids),
    });
    await repos_1.repos.resume().save(resume);
    res.status(201).json((0, presenters_1.presentResume)(resume));
};
exports.createResume = createResume;
const getResume = async (req, res) => {
    const resume = await repos_1.repos.resume().findOne({
        where: { id: Number(req.params.resumeId) },
        relations: ['skills', 'workExperiences', 'educations'],
    });
    if (!resume)
        throw httpError_1.HttpError.notFound('Резюме не найдено');
    res.json((0, presenters_1.presentResumeDetail)(resume));
};
exports.getResume = getResume;
const updateResume = async (req, res) => {
    const resume = await ownedResume(req.user.id, Number(req.params.resumeId));
    const b = req.body;
    resume.title = b.title;
    resume.salaryExpected = b.salary_expected ?? null;
    if (b.currency)
        resume.currency = b.currency;
    resume.employmentType = b.employment_type ?? null;
    resume.schedule = b.schedule ?? null;
    if (b.status)
        resume.status = b.status;
    if (b.skill_ids)
        resume.skills = await loadSkills(b.skill_ids);
    await repos_1.repos.resume().save(resume);
    res.json((0, presenters_1.presentResume)(resume));
};
exports.updateResume = updateResume;
const deleteResume = async (req, res) => {
    await ownedResume(req.user.id, Number(req.params.resumeId));
    await repos_1.repos.resume().delete({ id: Number(req.params.resumeId) });
    res.status(204).send();
};
exports.deleteResume = deleteResume;
const setResumeSkills = async (req, res) => {
    const resume = await ownedResume(req.user.id, Number(req.params.resumeId), ['skills']);
    resume.skills = await loadSkills(req.body.skill_ids);
    await repos_1.repos.resume().save(resume);
    res.json((resume.skills ?? []).map(presenters_1.presentSkill));
};
exports.setResumeSkills = setResumeSkills;
// ---- work experiences ----
const listWorkExperiences = async (req, res) => {
    const resumeId = Number(req.params.resumeId);
    const exists = await repos_1.repos.resume().findOne({ where: { id: resumeId } });
    if (!exists)
        throw httpError_1.HttpError.notFound('Резюме не найдено');
    const items = await repos_1.repos.workExperience().find({ where: { resumeId }, order: { startDate: 'DESC' } });
    res.json(items.map(presenters_1.presentWorkExperience));
};
exports.listWorkExperiences = listWorkExperiences;
const createWorkExperience = async (req, res) => {
    const resume = await ownedResume(req.user.id, Number(req.params.resumeId));
    const b = req.body;
    const we = repos_1.repos.workExperience().create({
        resumeId: resume.id,
        companyName: b.company_name,
        position: b.position,
        startDate: b.start_date,
        endDate: b.end_date ?? null,
        isCurrent: b.is_current ?? false,
        description: b.description ?? null,
    });
    await repos_1.repos.workExperience().save(we);
    res.status(201).json((0, presenters_1.presentWorkExperience)(we));
};
exports.createWorkExperience = createWorkExperience;
const ownedWorkExperience = async (userId, id) => {
    const we = await repos_1.repos.workExperience().findOne({ where: { id } });
    if (!we)
        throw httpError_1.HttpError.notFound('Запись об опыте не найдена');
    await ownedResume(userId, we.resumeId);
    return we;
};
const updateWorkExperience = async (req, res) => {
    const we = await ownedWorkExperience(req.user.id, Number(req.params.id));
    const b = req.body;
    we.companyName = b.company_name;
    we.position = b.position;
    we.startDate = b.start_date;
    we.endDate = b.end_date ?? null;
    we.isCurrent = b.is_current ?? false;
    we.description = b.description ?? null;
    await repos_1.repos.workExperience().save(we);
    res.json((0, presenters_1.presentWorkExperience)(we));
};
exports.updateWorkExperience = updateWorkExperience;
const deleteWorkExperience = async (req, res) => {
    await ownedWorkExperience(req.user.id, Number(req.params.id));
    await repos_1.repos.workExperience().delete({ id: Number(req.params.id) });
    res.status(204).send();
};
exports.deleteWorkExperience = deleteWorkExperience;
// ---- educations ----
const listEducations = async (req, res) => {
    const resumeId = Number(req.params.resumeId);
    const exists = await repos_1.repos.resume().findOne({ where: { id: resumeId } });
    if (!exists)
        throw httpError_1.HttpError.notFound('Резюме не найдено');
    const items = await repos_1.repos.education().find({ where: { resumeId }, order: { startYear: 'DESC' } });
    res.json(items.map(presenters_1.presentEducation));
};
exports.listEducations = listEducations;
const createEducation = async (req, res) => {
    const resume = await ownedResume(req.user.id, Number(req.params.resumeId));
    const b = req.body;
    const ed = repos_1.repos.education().create({
        resumeId: resume.id,
        institution: b.institution,
        degree: b.degree ?? null,
        fieldOfStudy: b.field_of_study ?? null,
        startYear: b.start_year,
        endYear: b.end_year ?? null,
    });
    await repos_1.repos.education().save(ed);
    res.status(201).json((0, presenters_1.presentEducation)(ed));
};
exports.createEducation = createEducation;
const ownedEducation = async (userId, id) => {
    const ed = await repos_1.repos.education().findOne({ where: { id } });
    if (!ed)
        throw httpError_1.HttpError.notFound('Запись об образовании не найдена');
    await ownedResume(userId, ed.resumeId);
    return ed;
};
const updateEducation = async (req, res) => {
    const ed = await ownedEducation(req.user.id, Number(req.params.id));
    const b = req.body;
    ed.institution = b.institution;
    ed.degree = b.degree ?? null;
    ed.fieldOfStudy = b.field_of_study ?? null;
    ed.startYear = b.start_year;
    ed.endYear = b.end_year ?? null;
    await repos_1.repos.education().save(ed);
    res.json((0, presenters_1.presentEducation)(ed));
};
exports.updateEducation = updateEducation;
const deleteEducation = async (req, res) => {
    await ownedEducation(req.user.id, Number(req.params.id));
    await repos_1.repos.education().delete({ id: Number(req.params.id) });
    res.status(204).send();
};
exports.deleteEducation = deleteEducation;
//# sourceMappingURL=resumeController.js.map