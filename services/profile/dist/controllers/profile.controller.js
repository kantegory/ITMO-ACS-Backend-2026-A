"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const mappers_1 = require("../utils/mappers");
const resume_mappers_1 = require("../utils/resume.mappers");
const params_1 = require("../utils/params");
const errors_1 = require("../utils/errors");
class ProfileController {
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
            res.json({ items: items.map(resume_mappers_1.toResumeDetails) });
        }
        catch (e) {
            next(e);
        }
    }
    static async getResume(req, res, next) {
        try {
            const resume = await profile_service_1.ProfileService.getResume(req.user.userId, (0, params_1.routeParam)(req.params.id));
            res.json((0, resume_mappers_1.toResumeDetails)(resume));
        }
        catch (e) {
            next(e);
        }
    }
    static async createResume(req, res, next) {
        try {
            const resume = await profile_service_1.ProfileService.createResume(req.user.userId, {
                title: req.body.title,
                experienceLevel: req.body.experience_level,
            });
            res.status(201).json((0, resume_mappers_1.toResumeDetails)(resume));
        }
        catch (e) {
            next(e);
        }
    }
    static async updateResume(req, res, next) {
        try {
            const resume = await profile_service_1.ProfileService.updateResume(req.user.userId, (0, params_1.routeParam)(req.params.id), {
                title: req.body.title,
                experienceLevel: req.body.experience_level,
            });
            res.json((0, resume_mappers_1.toResumeDetails)(resume));
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
    static async upsertSummary(req, res, next) {
        try {
            if (!req.body.content?.trim())
                throw (0, errors_1.badRequest)();
            const summary = await profile_service_1.ProfileService.upsertSummary(req.user.userId, (0, params_1.routeParam)(req.params.id), req.body.content);
            res.json((0, resume_mappers_1.toResumeSummary)(summary));
        }
        catch (e) {
            next(e);
        }
    }
    static async deleteSummary(req, res, next) {
        try {
            await profile_service_1.ProfileService.deleteSummary(req.user.userId, (0, params_1.routeParam)(req.params.id));
            res.status(204).send();
        }
        catch (e) {
            next(e);
        }
    }
    static async listSkills(req, res, next) {
        try {
            const skills = await profile_service_1.ProfileService.listSkills(req.user.userId, (0, params_1.routeParam)(req.params.id));
            res.json({ items: skills.map(resume_mappers_1.toSkill) });
        }
        catch (e) {
            next(e);
        }
    }
    static async setSkills(req, res, next) {
        try {
            const skills = await profile_service_1.ProfileService.setSkills(req.user.userId, (0, params_1.routeParam)(req.params.id), req.body.skills ?? []);
            res.json({ items: skills.map(resume_mappers_1.toSkill) });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.ProfileController = ProfileController;
