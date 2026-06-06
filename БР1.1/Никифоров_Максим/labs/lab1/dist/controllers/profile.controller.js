"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const mappers_1 = require("../utils/mappers");
const params_1 = require("../utils/params");
class ProfileController {
    static async me(req, res, next) {
        try {
            const user = await profile_service_1.ProfileService.me(req.user.userId);
            res.json((0, mappers_1.toUser)(user));
        }
        catch (e) {
            next(e);
        }
    }
    static async upsertProfile(req, res, next) {
        try {
            const profile = await profile_service_1.ProfileService.upsertProfile(req.user.userId, req.body);
            res.json((0, mappers_1.toProfile)(profile));
        }
        catch (e) {
            next(e);
        }
    }
    static async listResumes(req, res, next) {
        try {
            const items = await profile_service_1.ProfileService.listResumes(req.user.userId);
            res.json({ items: items.map(mappers_1.toResume) });
        }
        catch (e) {
            next(e);
        }
    }
    static async createResume(req, res, next) {
        try {
            const resume = await profile_service_1.ProfileService.createResume(req.user.userId, {
                title: req.body.title,
                summary: req.body.summary,
                experienceLevel: req.body.experience_level,
                skills: req.body.skills,
            });
            res.status(201).json((0, mappers_1.toResume)(resume));
        }
        catch (e) {
            next(e);
        }
    }
    static async updateResume(req, res, next) {
        try {
            const resume = await profile_service_1.ProfileService.updateResume(req.user.userId, (0, params_1.routeParam)(req.params.id), {
                title: req.body.title,
                summary: req.body.summary,
                experienceLevel: req.body.experience_level,
                skills: req.body.skills,
            });
            res.json((0, mappers_1.toResume)(resume));
        }
        catch (e) {
            next(e);
        }
    }
    static async deleteResume(req, res, next) {
        try {
            await profile_service_1.ProfileService.deleteResume(req.user.userId, (0, params_1.routeParam)(req.params.id));
            res.status(204).send();
        }
        catch (e) {
            next(e);
        }
    }
}
exports.ProfileController = ProfileController;
