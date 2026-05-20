"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const CandidateProfile_1 = require("../entities/CandidateProfile");
const Resume_1 = require("../entities/Resume");
const errors_1 = require("../utils/errors");
const userRepo = () => data_source_1.AppDataSource.getRepository(User_1.User);
const profileRepo = () => data_source_1.AppDataSource.getRepository(CandidateProfile_1.CandidateProfile);
const resumeRepo = () => data_source_1.AppDataSource.getRepository(Resume_1.Resume);
class ProfileService {
    static async me(userId) {
        const user = await userRepo().findOneBy({ id: userId });
        if (!user)
            throw (0, errors_1.notFound)();
        return user;
    }
    static async upsertProfile(userId, data) {
        let profile = await profileRepo().findOne({ where: { userId } });
        if (!profile) {
            profile = profileRepo().create({ userId });
        }
        profile.city = data.city?.trim() || null;
        profile.phone = data.phone?.trim() || null;
        profile.about = data.about?.trim() || null;
        return profileRepo().save(profile);
    }
    static async listResumes(userId) {
        return resumeRepo().find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
    }
    static async createResume(userId, data) {
        const resume = resumeRepo().create({
            userId,
            title: data.title,
            summary: data.summary || null,
            experienceLevel: data.experienceLevel,
            skills: data.skills || [],
        });
        return resumeRepo().save(resume);
    }
    static async updateResume(userId, resumeId, data) {
        const resume = await resumeRepo().findOneBy({ id: resumeId });
        if (!resume)
            throw (0, errors_1.notFound)();
        if (resume.userId !== userId)
            throw (0, errors_1.forbidden)();
        resume.title = data.title ?? resume.title;
        resume.summary = data.summary ?? resume.summary;
        resume.experienceLevel = data.experienceLevel ?? resume.experienceLevel;
        resume.skills = data.skills ?? resume.skills;
        return resumeRepo().save(resume);
    }
    static async deleteResume(userId, resumeId) {
        const resume = await resumeRepo().findOneBy({ id: resumeId });
        if (!resume)
            throw (0, errors_1.notFound)();
        if (resume.userId !== userId)
            throw (0, errors_1.forbidden)();
        await resumeRepo().remove(resume);
    }
}
exports.ProfileService = ProfileService;
