import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { CandidateProfile } from "../entities/CandidateProfile";
import { Resume } from "../entities/Resume";
import { forbidden, notFound } from "../utils/errors";

const userRepo = () => AppDataSource.getRepository(User);
const profileRepo = () => AppDataSource.getRepository(CandidateProfile);
const resumeRepo = () => AppDataSource.getRepository(Resume);

export class ProfileService {
  static async me(userId: string) {
    const user = await userRepo().findOneBy({ id: userId });
    if (!user) throw notFound();
    return user;
  }

  static async upsertProfile(
    userId: string,
    data: { city?: string; phone?: string; about?: string },
  ) {
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
    return resumeRepo().find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  static async createResume(userId: string, data: Partial<Resume>) {
    const resume = resumeRepo().create({
      userId,
      title: data.title!,
      summary: data.summary || null,
      experienceLevel: data.experienceLevel!,
      skills: data.skills || [],
    });
    return resumeRepo().save(resume);
  }

  static async updateResume(userId: string, resumeId: string, data: Partial<Resume>) {
    const resume = await resumeRepo().findOneBy({ id: resumeId });
    if (!resume) throw notFound();
    if (resume.userId !== userId) throw forbidden();
    resume.title = data.title ?? resume.title;
    resume.summary = data.summary ?? resume.summary;
    resume.experienceLevel = data.experienceLevel ?? resume.experienceLevel;
    resume.skills = data.skills ?? resume.skills;
    return resumeRepo().save(resume);
  }

  static async deleteResume(userId: string, resumeId: string) {
    const resume = await resumeRepo().findOneBy({ id: resumeId });
    if (!resume) throw notFound();
    if (resume.userId !== userId) throw forbidden();
    await resumeRepo().remove(resume);
  }
}
