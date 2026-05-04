import { AppDataSource } from '../config/database';
import { Resume } from '../entities/Resume';
import { JobSeeker } from '../entities/JobSeeker';
import { WorkExperience } from '../entities/WorkExperience';
import { Education } from '../entities/Education';
import { ResumeSkill } from '../entities/ResumeSkill';
import { Skill } from '../entities/Skill';
import { DegreeType } from '../entities/DegreeType';
import { UserRole } from '../entities/User';
import {
  CreateResumeDto,
  UpdateResumeDto,
  AddResumeSkillDto,
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
  CreateEducationDto,
  UpdateEducationDto,
} from '../dto/ResumeDto';
import { AppError } from '../utils/errors';

const resumeRelations = {
  jobSeeker: { city: { country: true } },
  resumeSkills: { skill: true },
  workExperiences: true,
  educations: { degreeType: true },
} as const;

function calcExperienceMonths(workExperiences: WorkExperience[]): number {
  const now = new Date();
  return workExperiences.reduce((total, we) => {
    const start = new Date(we.start_date);
    const end = we.is_current || !we.end_date ? now : new Date(we.end_date);
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return total + Math.max(0, months);
  }, 0);
}

function toShort(r: Resume) {
  return {
    id: r.id,
    title: r.title,
    isPublished: r.is_published,
    experienceMonths: r.experience_months_cached,
    updatedAt: r.updated_at,
  };
}

function toDetail(r: Resume) {
  const city = r.jobSeeker?.city;
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    isPublished: r.is_published,
    experienceMonths: r.experience_months_cached,
    city: city
      ? {
          id: city.id,
          name: city.name,
          country: city.country ? { id: city.country.id, name: city.country.name } : null,
        }
      : null,
    skills: (r.resumeSkills || []).map((rs) => ({
      id: rs.id,
      skill: { id: rs.skill.id, name: rs.skill.name },
      level: rs.level,
    })),
    workExperience: (r.workExperiences || []).map((we) => ({
      id: we.id,
      companyName: we.company_name,
      role: we.role,
      startDate: we.start_date,
      endDate: we.end_date,
      isCurrent: we.is_current,
    })),
    education: (r.educations || []).map((edu) => ({
      id: edu.id,
      degreeType: edu.degreeType?.name ?? null,
      institution: edu.institution,
      programName: edu.program_name,
      startDate: edu.start_date,
      endDate: edu.end_date,
    })),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class ResumeService {
  private resumeRepo = AppDataSource.getRepository(Resume);
  private seekerRepo = AppDataSource.getRepository(JobSeeker);
  private workExpRepo = AppDataSource.getRepository(WorkExperience);
  private educationRepo = AppDataSource.getRepository(Education);
  private resumeSkillRepo = AppDataSource.getRepository(ResumeSkill);
  private skillRepo = AppDataSource.getRepository(Skill);
  private degreeTypeRepo = AppDataSource.getRepository(DegreeType);

  private async getSeeker(userId: string) {
    const seeker = await this.seekerRepo.findOne({ where: { user_id: userId } });
    if (!seeker) throw new AppError(404, 'Seeker profile not found');
    return seeker;
  }

  private async getResume(resumeId: string) {
    const resume = await this.resumeRepo.findOne({
      where: { id: resumeId },
      relations: resumeRelations,
    });
    if (!resume) throw new AppError(404, 'Resume not found');
    return resume;
  }

  private assertOwner(resume: Resume, userId: string) {
    if (resume.jobSeeker.user_id !== userId) throw new AppError(403, 'Forbidden');
  }

  private async recalcExperience(resume: Resume) {
    const workExperiences = await this.workExpRepo.find({ where: { resume_id: resume.id } });
    const months = calcExperienceMonths(workExperiences);
    await this.resumeRepo.update(resume.id, { experience_months_cached: months });
  }

  async findMy(userId: string) {
    const seeker = await this.getSeeker(userId);
    const resumes = await this.resumeRepo.find({ where: { job_seeker_id: seeker.id } });
    return resumes.map(toShort);
  }

  async create(userId: string, dto: CreateResumeDto) {
    const seeker = await this.getSeeker(userId);
    const resume = this.resumeRepo.create({
      job_seeker_id: seeker.id,
      title: dto.title,
      summary: dto.summary ?? null,
      is_published: dto.isPublished ?? false,
    });
    await this.resumeRepo.save(resume);
    const saved = await this.getResume(resume.id);
    return toDetail(saved);
  }

  async findOne(resumeId: string, userId: string, role: string) {
    const resume = await this.getResume(resumeId);
    if (role === UserRole.SEEKER && resume.jobSeeker.user_id !== userId) {
      throw new AppError(403, 'Forbidden');
    }
    return toDetail(resume);
  }

  async update(resumeId: string, userId: string, dto: UpdateResumeDto) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    if (dto.title !== undefined) resume.title = dto.title;
    if (dto.summary !== undefined) resume.summary = dto.summary;
    if (dto.isPublished !== undefined) resume.is_published = dto.isPublished;

    await this.resumeRepo.save(resume);
    const saved = await this.getResume(resumeId);
    return toDetail(saved);
  }

  async remove(resumeId: string, userId: string) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);
    await this.resumeRepo.remove(resume);
  }

  async addSkill(resumeId: string, userId: string, dto: AddResumeSkillDto) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const skill = await this.skillRepo.findOne({ where: { id: dto.skillId } });
    if (!skill) throw new AppError(404, 'Skill not found');

    const existing = await this.resumeSkillRepo.findOne({
      where: { resume_id: resumeId, skill_id: dto.skillId },
    });
    if (existing) throw new AppError(409, 'Skill already added to this resume');

    const rs = this.resumeSkillRepo.create({
      resume_id: resumeId,
      skill_id: dto.skillId,
      level: dto.level,
    });
    await this.resumeSkillRepo.save(rs);

    return { id: rs.id, skill: { id: skill.id, name: skill.name }, level: rs.level };
  }

  async removeSkill(resumeId: string, skillId: string, userId: string) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const rs = await this.resumeSkillRepo.findOne({
      where: { resume_id: resumeId, skill_id: skillId },
    });
    if (!rs) throw new AppError(404, 'Skill not found in resume');
    await this.resumeSkillRepo.remove(rs);
  }

  async addWorkExperience(resumeId: string, userId: string, dto: CreateWorkExperienceDto) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const we = this.workExpRepo.create({
      resume_id: resumeId,
      company_name: dto.companyName,
      role: dto.role,
      start_date: dto.startDate,
      end_date: dto.endDate ?? null,
      is_current: dto.isCurrent ?? false,
    });
    await this.workExpRepo.save(we);
    await this.recalcExperience(resume);

    return {
      id: we.id,
      companyName: we.company_name,
      role: we.role,
      startDate: we.start_date,
      endDate: we.end_date,
      isCurrent: we.is_current,
    };
  }

  async updateWorkExperience(
    resumeId: string,
    workId: string,
    userId: string,
    dto: UpdateWorkExperienceDto,
  ) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const we = await this.workExpRepo.findOne({ where: { id: workId, resume_id: resumeId } });
    if (!we) throw new AppError(404, 'Work experience not found');

    if (dto.companyName !== undefined) we.company_name = dto.companyName;
    if (dto.role !== undefined) we.role = dto.role;
    if (dto.startDate !== undefined) we.start_date = dto.startDate;
    if (dto.endDate !== undefined) we.end_date = dto.endDate;
    if (dto.isCurrent !== undefined) we.is_current = dto.isCurrent;

    await this.workExpRepo.save(we);
    await this.recalcExperience(resume);

    return {
      id: we.id,
      companyName: we.company_name,
      role: we.role,
      startDate: we.start_date,
      endDate: we.end_date,
      isCurrent: we.is_current,
    };
  }

  async removeWorkExperience(resumeId: string, workId: string, userId: string) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const we = await this.workExpRepo.findOne({ where: { id: workId, resume_id: resumeId } });
    if (!we) throw new AppError(404, 'Work experience not found');
    await this.workExpRepo.remove(we);
    await this.recalcExperience(resume);
  }

  async addEducation(resumeId: string, userId: string, dto: CreateEducationDto) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const degreeType = await this.degreeTypeRepo.findOne({ where: { id: dto.degreeTypeId } });
    if (!degreeType) throw new AppError(404, 'Degree type not found');

    const edu = this.educationRepo.create({
      resume_id: resumeId,
      degree_type_id: dto.degreeTypeId,
      institution: dto.institution,
      program_name: dto.programName ?? null,
      start_date: dto.startDate ?? null,
      end_date: dto.endDate ?? null,
    });
    await this.educationRepo.save(edu);

    return {
      id: edu.id,
      degreeType: degreeType.name,
      institution: edu.institution,
      programName: edu.program_name,
      startDate: edu.start_date,
      endDate: edu.end_date,
    };
  }

  async updateEducation(
    resumeId: string,
    educationId: string,
    userId: string,
    dto: UpdateEducationDto,
  ) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const edu = await this.educationRepo.findOne({
      where: { id: educationId, resume_id: resumeId },
      relations: { degreeType: true },
    });
    if (!edu) throw new AppError(404, 'Education not found');

    if (dto.degreeTypeId !== undefined) {
      const dt = await this.degreeTypeRepo.findOne({ where: { id: dto.degreeTypeId } });
      if (!dt) throw new AppError(404, 'Degree type not found');
      edu.degree_type_id = dto.degreeTypeId;
      edu.degreeType = dt;
    }
    if (dto.institution !== undefined) edu.institution = dto.institution;
    if (dto.programName !== undefined) edu.program_name = dto.programName;
    if (dto.startDate !== undefined) edu.start_date = dto.startDate;
    if (dto.endDate !== undefined) edu.end_date = dto.endDate;

    await this.educationRepo.save(edu);

    return {
      id: edu.id,
      degreeType: edu.degreeType?.name ?? null,
      institution: edu.institution,
      programName: edu.program_name,
      startDate: edu.start_date,
      endDate: edu.end_date,
    };
  }

  async removeEducation(resumeId: string, educationId: string, userId: string) {
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, userId);

    const edu = await this.educationRepo.findOne({
      where: { id: educationId, resume_id: resumeId },
    });
    if (!edu) throw new AppError(404, 'Education not found');
    await this.educationRepo.remove(edu);
  }
}
