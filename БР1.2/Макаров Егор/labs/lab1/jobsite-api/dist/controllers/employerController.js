"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.currentEmployer = void 0;
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const presenters_1 = require("../presenters");
const currentEmployer = async (userId, withCompany = false) => {
    const employer = await repos_1.repos.employer().findOne({
        where: { userId },
        relations: withCompany ? ['company', 'company.industry'] : [],
    });
    if (!employer)
        throw httpError_1.HttpError.notFound('Профиль работодателя не найден');
    return employer;
};
exports.currentEmployer = currentEmployer;
const getProfile = async (req, res) => {
    const employer = await (0, exports.currentEmployer)(req.user.id, true);
    res.json((0, presenters_1.presentEmployer)(employer));
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const employer = await (0, exports.currentEmployer)(req.user.id);
    const b = req.body;
    if (b.company_id !== undefined) {
        const company = await repos_1.repos.company().findOne({ where: { id: b.company_id } });
        if (!company)
            throw httpError_1.HttpError.validation('Компания не найдена', [
                { field: 'company_id', message: 'Компания не найдена' },
            ]);
        employer.companyId = company.id;
    }
    if (b.position !== undefined)
        employer.position = b.position ?? null;
    await repos_1.repos.employer().save(employer);
    const reloaded = await (0, exports.currentEmployer)(req.user.id, true);
    res.json((0, presenters_1.presentEmployer)(reloaded));
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=employerController.js.map