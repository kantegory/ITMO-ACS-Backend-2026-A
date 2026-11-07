"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublic = exports.updateProfile = exports.getProfile = exports.currentSeeker = void 0;
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const presenters_1 = require("../presenters");
const currentSeeker = async (userId) => {
    const seeker = await repos_1.repos.jobSeeker().findOne({ where: { userId } });
    if (!seeker)
        throw httpError_1.HttpError.notFound('Профиль соискателя не найден');
    return seeker;
};
exports.currentSeeker = currentSeeker;
const getProfile = async (req, res) => {
    const seeker = await (0, exports.currentSeeker)(req.user.id);
    res.json((0, presenters_1.presentJobSeeker)(seeker));
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const seeker = await (0, exports.currentSeeker)(req.user.id);
    const b = req.body;
    seeker.firstName = b.first_name;
    seeker.lastName = b.last_name;
    seeker.phone = b.phone ?? null;
    seeker.city = b.city ?? null;
    seeker.avatarUrl = b.avatar_url ?? null;
    seeker.about = b.about ?? null;
    await repos_1.repos.jobSeeker().save(seeker);
    res.json((0, presenters_1.presentJobSeeker)(seeker));
};
exports.updateProfile = updateProfile;
const getPublic = async (req, res) => {
    const seeker = await repos_1.repos.jobSeeker().findOne({ where: { id: Number(req.params.seekerId) } });
    if (!seeker)
        throw httpError_1.HttpError.notFound('Соискатель не найден');
    res.json((0, presenters_1.presentJobSeeker)(seeker));
};
exports.getPublic = getPublic;
//# sourceMappingURL=seekerController.js.map