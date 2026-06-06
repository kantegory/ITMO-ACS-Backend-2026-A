"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toResumeDetails = exports.toSkill = exports.toResumeSummary = exports.toResume = void 0;
const toResume = (r) => ({
    id: r.id,
    title: r.title,
    experience_level: r.experienceLevel,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
});
exports.toResume = toResume;
const toResumeSummary = (s) => ({
    id: s.id,
    resume_id: s.resumeId,
    content: s.content,
    updated_at: s.updatedAt,
});
exports.toResumeSummary = toResumeSummary;
const toSkill = (s) => ({
    id: s.id,
    name: s.name,
});
exports.toSkill = toSkill;
const toResumeDetails = (r) => ({
    ...(0, exports.toResume)(r),
    summary: r.summary ? (0, exports.toResumeSummary)(r.summary) : null,
    skills: (r.resumeSkills ?? []).map((rs) => (0, exports.toSkill)(rs.skill)),
});
exports.toResumeDetails = toResumeDetails;
