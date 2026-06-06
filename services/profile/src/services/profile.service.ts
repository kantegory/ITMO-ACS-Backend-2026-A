import { AppDataSource } from "../data-source";
import { CandidateProfile } from "../entities/CandidateProfile";
import { Resume, ExperienceLevel } from "../entities/Resume";
import { ResumeSummary } from "../entities/ResumeSummary";
import { ResumeSkill } from "../entities/ResumeSkill";
import { Skill } from "../entities/Skill";
import { validateUser } from "../clients/authClient";
import { forbidden, notFound } from "../utils/errors";

const profileRepo = () => AppDataSource.getRepository(CandidateProfile);
const resumeRepo = () => AppDataSource.getRepository(Resume);
const summaryRepo = () => AppDataSource.getRepository(ResumeSummary);
const skillRepo = () => AppDataSource.getRepository(Skill);
const resumeSkillRepo = () => AppDataSource.getRepository(ResumeSkill);

const resumeRelations = {
  relations: ["summary", "resumeSkills", "resumeSkills.skill"],
};

async function ownedResume(userId: string, resumeId: string) {
  const resume = await resumeRepo().findOneBy({ id: resumeId });
  if (!resume) throw notFound();
  if (resume.userId !== userId) throw forbidden();
  return resume;
}

async function loadResume(id: string) {
  const resume = await resumeRepo().findOne({ where: { id }, ...resumeRelations });
  if (!resume) throw notFound();
  return resume;
}

function normalizeSkillNames(names: string[]): string[] {
  return [...new Set(names.map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

async function upsertSkills(names: string[]): Promise<Skill[]> {
  const result: Skill[] = [];
  for (const name of names) {
    let skill = await skillRepo().findOne({ where: { name } });
    if (!skill) {
      skill = await skillRepo().save(skillRepo().create({ name }));
    }
    result.push(skill);
  }
  return result;
}

export class ProfileService {
  static async ensureProfile(userId: string) {
    let profile = await profileRepo().findOne({ where: { userId } });
    if (!profile) {
      profile = profileRepo().create({ userId });
      await profileRepo().save(profile);
    }
    return profile;
  }

  static async upsertProfile(
    userId: string,
    data: { city?: string; phone?: string; about?: string },
  ) {
    await validateUser(userId, "candidate");
    let profile = await profileRepo().findOne({ where: { userId } });
    if (!profile) {
      profile = profileRepo().create({ userId });
    }
    profile.city = data.city?.trim() || null;
    profile.phone = data.phone?.trim() || null;
    profile.about = data.about?.trim() || null;
    return profileRepo().save(profile);
  }

  static async listResumes(userId: string) {
    await validateUser(userId, "candidate");
    return resumeRepo().find({
      where: { userId },
      ...resumeRelations,
      order: { createdAt: "DESC" },
    });
  }

  static async getResume(userId: string, resumeId: string) {
    await ownedResume(userId, resumeId);
    return loadResume(resumeId);
  }

  static async createResume(
    userId: string,
    data: { title: string; experienceLevel: ExperienceLevel },
  ) {
    await validateUser(userId, "candidate");
    const resume = await resumeRepo().save(
      resumeRepo().create({
        userId,
        title: data.title,
        experienceLevel: data.experienceLevel,
      }),
    );
    return loadResume(resume.id);
  }

  static async updateResume(
    userId: string,
    resumeId: string,
    data: { title?: string; experienceLevel?: ExperienceLevel },
  ) {
    const resume = await ownedResume(userId, resumeId);
    if (data.title !== undefined) resume.title = data.title;
    if (data.experienceLevel !== undefined) resume.experienceLevel = data.experienceLevel;
    await resumeRepo().save(resume);
    return loadResume(resumeId);
  }

  static async deleteResume(userId: string, resumeId: string) {
    const resume = await ownedResume(userId, resumeId);
    await resumeRepo().remove(resume);
  }

  static async upsertSummary(userId: string, resumeId: string, content: string) {
    await ownedResume(userId, resumeId);
    const trimmed = content.trim();
    if (!trimmed) throw new Error("content required");

    let summary = await summaryRepo().findOne({ where: { resumeId } });
    if (!summary) {
      summary = summaryRepo().create({ resumeId, content: trimmed });
    } else {
      summary.content = trimmed;
    }
    return summaryRepo().save(summary);
  }

  static async deleteSummary(userId: string, resumeId: string) {
    await ownedResume(userId, resumeId);
    const summary = await summaryRepo().findOne({ where: { resumeId } });
    if (summary) await summaryRepo().remove(summary);
  }

  static async listSkills(userId: string, resumeId: string) {
    await ownedResume(userId, resumeId);
    const links = await resumeSkillRepo().find({
      where: { resumeId },
      relations: ["skill"],
      order: { skillId: "ASC" },
    });
    return links.map((l) => l.skill);
  }

  static async setSkills(userId: string, resumeId: string, names: string[]) {
    await ownedResume(userId, resumeId);
    await resumeSkillRepo().delete({ resumeId });
    const skills = await upsertSkills(normalizeSkillNames(names));
    for (const skill of skills) {
      await resumeSkillRepo().save({ resumeId, skillId: skill.id });
    }
    return skills;
  }
}
