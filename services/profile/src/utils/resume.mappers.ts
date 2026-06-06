import { Resume } from "../entities/Resume";
import { ResumeSummary } from "../entities/ResumeSummary";
import { Skill } from "../entities/Skill";

export const toResume = (r: Resume) => ({
  id: r.id,
  title: r.title,
  experience_level: r.experienceLevel,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
});

export const toResumeSummary = (s: ResumeSummary) => ({
  id: s.id,
  resume_id: s.resumeId,
  content: s.content,
  updated_at: s.updatedAt,
});

export const toSkill = (s: Skill) => ({
  id: s.id,
  name: s.name,
});

export const toResumeDetails = (r: Resume) => ({
  ...toResume(r),
  summary: r.summary ? toResumeSummary(r.summary) : null,
  skills: (r.resumeSkills ?? []).map((rs) => toSkill(rs.skill)),
});
