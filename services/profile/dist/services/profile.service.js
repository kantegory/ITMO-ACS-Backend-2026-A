"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const data_source_1 = require("../data-source");
const CandidateProfile_1 = require("../entities/CandidateProfile");
const Resume_1 = require("../entities/Resume");
const ResumeSummary_1 = require("../entities/ResumeSummary");
const ResumeSkill_1 = require("../entities/ResumeSkill");
const Skill_1 = require("../entities/Skill");
const authClient_1 = require("../clients/authClient");
const errors_1 = require("../utils/errors");
const profileRepo = () => data_source_1.AppDataSource.getRepository(CandidateProfile_1.CandidateProfile);
const resumeRepo = () => data_source_1.AppDataSource.getRepository(Resume_1.Resume);
const summaryRepo = () => data_source_1.AppDataSource.getRepository(ResumeSummary_1.ResumeSummary);
const skillRepo = () => data_source_1.AppDataSource.getRepository(Skill_1.Skill);
const resumeSkillRepo = () => data_source_1.AppDataSource.getRepository(ResumeSkill_1.ResumeSkill);
const resumeRelations = {
    relations: ["summary", "resumeSkills", "resumeSkills.skill"],
};
async function ownedResume(userId, resumeId) {
    const resume = await resumeRepo().findOneBy({ id: resumeId });
    if (!resume)
        throw (0, errors_1.notFound)();
    if (resume.userId !== userId)
        throw (0, errors_1.forbidden)();
    return resume;
}
async function loadResume(id) {
    const resume = await resumeRepo().findOne({ where: { id }, ...resumeRelations });
    if (!resume)
        throw (0, errors_1.notFound)();
    return resume;
}
function normalizeSkillNames(names) {
    return [...new Set(names.map((s) => s.trim().toLowerCase()).filter(Boolean))];
}
async function upsertSkills(names) {
    const result = [];
    for (const name of names) {
        let skill = await skillRepo().findOne({ where: { name } });
        if (!skill) {
            skill = await skillRepo().save(skillRepo().create({ name }));
        }
        result.push(skill);
    }
    return result;
}
class ProfileService {
    static async ensureProfile(userId) {
        let profile = await profileRepo().findOne({ where: { userId } });
        if (!profile) {
            profile = profileRepo().create({ userId });
            await profileRepo().save(profile);
        }
        return profile;
    }
    static async upsertProfile(userId, data) {
        await (0, authClient_1.validateUser)(userId, "candidate");
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
        await (0, authClient_1.validateUser)(userId, "candidate");
        return resumeRepo().find({
            where: { userId },
            ...resumeRelations,
            order: { createdAt: "DESC" },
        });
    }
    static async getResume(userId, resumeId) {
        await ownedResume(userId, resumeId);
        return loadResume(resumeId);
    }
    static async createResume(userId, data) {
        await (0, authClient_1.validateUser)(userId, "candidate");
        const resume = await resumeRepo().save(resumeRepo().create({
            userId,
            title: data.title,
            experienceLevel: data.experienceLevel,
        }));
        return loadResume(resume.id);
    }
    static async updateResume(userId, resumeId, data) {
        const resume = await ownedResume(userId, resumeId);
        if (data.title !== undefined)
            resume.title = data.title;
        if (data.experienceLevel !== undefined)
            resume.experienceLevel = data.experienceLevel;
        await resumeRepo().save(resume);
        return loadResume(resumeId);
    }
    static async deleteResume(userId, resumeId) {
        const resume = await ownedResume(userId, resumeId);
        await resumeRepo().remove(resume);
    }
    static async upsertSummary(userId, resumeId, content) {
        await ownedResume(userId, resumeId);
        const trimmed = content.trim();
        if (!trimmed)
            throw new Error("content required");
        let summary = await summaryRepo().findOne({ where: { resumeId } });
        if (!summary) {
            summary = summaryRepo().create({ resumeId, content: trimmed });
        }
        else {
            summary.content = trimmed;
        }
        return summaryRepo().save(summary);
    }
    static async deleteSummary(userId, resumeId) {
        await ownedResume(userId, resumeId);
        const summary = await summaryRepo().findOne({ where: { resumeId } });
        if (summary)
            await summaryRepo().remove(summary);
    }
    static async listSkills(userId, resumeId) {
        await ownedResume(userId, resumeId);
        const links = await resumeSkillRepo().find({
            where: { resumeId },
            relations: ["skill"],
            order: { skillId: "ASC" },
        });
        return links.map((l) => l.skill);
    }
    static async setSkills(userId, resumeId, names) {
        await ownedResume(userId, resumeId);
        await resumeSkillRepo().delete({ resumeId });
        const skills = await upsertSkills(normalizeSkillNames(names));
        for (const skill of skills) {
            await resumeSkillRepo().save({ resumeId, skillId: skill.id });
        }
        return skills;
    }
}
exports.ProfileService = ProfileService;
