import { AppDataSource } from '../config/database';
import { Resume } from '../entities/Resume';
import { WorkExperience } from '../entities/WorkExperience';
import { Education } from '../entities/Education';
import { ResumeSkill } from '../entities/ResumeSkill';
import { getSeekerByUser, SeekerDto } from '../clients/user.client';
import { getSkillById, getDegreeTypeById } from '../clients/dictionary.client';
import {
  CreateResumeDto, UpdateResumeDto, AddResumeSkillDto,
  CreateWorkExperienceDto, UpdateWorkExperienceDto,
  CreateEducationDto, UpdateEducationDto,
} from '../dto/ResumeDto';
import { AppError } from '../utils/errors';

const fullRelations = {
  workExperiences: true,
  educations: true,
  resumeSkills: true,
} as const;

function calcExperienceMonths(workExperiences: WorkExperience[]): number {
  const now = new Date();
  return workExperiences.reduce((total, we) => {
    const start = new Date(we.start_date);
    const end = we.is_current || !we.end_date ? now : new Date(we.end_date);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
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
  return {
    id: r.id,
    jobSeekerId: r.job_seeker_id,
    title: r.title,
    summary: r.summary,
    isPublished: r.is_published,
    experienceMonths: r.experience_months_cached,
    skills: (r.resumeSkills || []).map((rs) => ({
      id: rs.id, skillId: rs.skill_id, level: rs.level,
    })),
    workExperience: (r.workExperiences || []).map((we) => ({
      id: we.id, companyName: we.company_name, role: we.role,
      startDate: we.start_date, endDate: we.end_date, isCurrent: we.is_current,
    })),
    education: (r.educations || []).map((edu) => ({
      id: edu.id, degreeTypeId: edu.degree_type_id,
      institution: edu.institution, programName: edu.program_name,
      startDate: edu.start_date, endDate: edu.end_date,
    })),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class ResumeService {
  private resumeRepo = AppDataSource.getRepository(Resume);
  private workExpRepo = AppDataSource.getRepository(WorkExperience);
  private educationRepo = AppDataSource.getRepository(Education);
  private resumeSkillRepo = AppDataSource.getRepository(ResumeSkill);

  private async requireSeeker(userId: string): Promise<SeekerDto> {
    const seeker = await getSeekerByUser(userId);
    if (!seeker) throw new AppError(404, 'Seeker profile not found');
    return seeker;
  }

  private async getResume(resumeId: string) {
    const r = await this.resumeRepo.findOne({ where: { id: resumeId }, relations: fullRelations });
    if (!r) throw new AppError(404, 'Resume not found');
    return r;
  }

  private assertOwner(resume: Resume, seekerId: string) {
    if (resume.job_seeker_id !== seekerId) throw new AppError(403, 'Forbidden');
  }

  private async recalcExperience(resumeId: string) {
    const wes = await this.workExpRepo.find({ where: { resume_id: resumeId } });
    await this.resumeRepo.update(resumeId, { experience_months_cached: calcExperienceMonths(wes) });
  }

  async findMy(userId: string) {
    const seeker = await this.requireSeeker(userId);
    const resumes = await this.resumeRepo.find({ where: { job_seeker_id: seeker.id } });
    return resumes.map(toShort);
  }

  async create(userId: string, dto: CreateResumeDto) {
    const seeker = await this.requireSeeker(userId);
    const resume = this.resumeRepo.create({
      job_seeker_id: seeker.id,
      title: dto.title,
      summary: dto.summary ?? null,
      is_published: dto.isPublished ?? false,
    });
    await this.resumeRepo.save(resume);
    return toDetail(await this.getResume(resume.id));
  }

  async findOne(resumeId: string, userId: string, role: string) {
    const resume = await this.getResume(resumeId);
    if (role === 'SEEKER') {
      const seeker = await this.requireSeeker(userId);
      if (resume.job_seeker_id !== seeker.id) throw new AppError(403, 'Forbidden');
    }
    return toDetail(resume);
  }

  async update(resumeId: string, userId: string, dto: UpdateResumeDto) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    if (dto.title !== undefined) resume.title = dto.title;
    if (dto.summary !== undefined) resume.summary = dto.summary ?? null;
    if (dto.isPublished !== undefined) resume.is_published = dto.isPublished;

    await this.resumeRepo.save(resume);
    return toDetail(await this.getResume(resumeId));
  }

  async remove(resumeId: string, userId: string) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);
    await this.resumeRepo.remove(resume);
  }

  async addSkill(resumeId: string, userId: string, dto: AddResumeSkillDto) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const skill = await getSkillById(dto.skillId);
    if (!skill) throw new AppError(404, 'Skill not found');

    const existing = await this.resumeSkillRepo.findOne({
      where: { resume_id: resumeId, skill_id: dto.skillId },
    });
    if (existing) throw new AppError(409, 'Skill already added to this resume');

    const rs = this.resumeSkillRepo.create({ resume_id: resumeId, skill_id: dto.skillId, level: dto.level });
    await this.resumeSkillRepo.save(rs);
    return { id: rs.id, skillId: rs.skill_id, skillName: skill.name, level: rs.level };
  }

  async removeSkill(resumeId: string, skillId: string, userId: string) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const rs = await this.resumeSkillRepo.findOne({ where: { resume_id: resumeId, skill_id: skillId } });
    if (!rs) throw new AppError(404, 'Skill not found in resume');
    await this.resumeSkillRepo.remove(rs);
  }

  async addWorkExperience(resumeId: string, userId: string, dto: CreateWorkExperienceDto) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const we = this.workExpRepo.create({
      resume_id: resumeId,
      company_name: dto.companyName,
      role: dto.role,
      start_date: dto.startDate,
      end_date: dto.endDate ?? null,
      is_current: dto.isCurrent ?? false,
    });
    await this.workExpRepo.save(we);
    await this.recalcExperience(resumeId);

    return { id: we.id, companyName: we.company_name, role: we.role, startDate: we.start_date, endDate: we.end_date, isCurrent: we.is_current };
  }

  async updateWorkExperience(resumeId: string, workId: string, userId: string, dto: UpdateWorkExperienceDto) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const we = await this.workExpRepo.findOne({ where: { id: workId, resume_id: resumeId } });
    if (!we) throw new AppError(404, 'Work experience not found');

    if (dto.companyName !== undefined) we.company_name = dto.companyName;
    if (dto.role !== undefined) we.role = dto.role;
    if (dto.startDate !== undefined) we.start_date = dto.startDate;
    if (dto.endDate !== undefined) we.end_date = dto.endDate ?? null;
    if (dto.isCurrent !== undefined) we.is_current = dto.isCurrent;

    await this.workExpRepo.save(we);
    await this.recalcExperience(resumeId);
    return { id: we.id, companyName: we.company_name, role: we.role, startDate: we.start_date, endDate: we.end_date, isCurrent: we.is_current };
  }

  async removeWorkExperience(resumeId: string, workId: string, userId: string) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const we = await this.workExpRepo.findOne({ where: { id: workId, resume_id: resumeId } });
    if (!we) throw new AppError(404, 'Work experience not found');
    await this.workExpRepo.remove(we);
    await this.recalcExperience(resumeId);
  }

  async addEducation(resumeId: string, userId: string, dto: CreateEducationDto) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const degreeType = await getDegreeTypeById(dto.degreeTypeId);
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
    return { id: edu.id, degreeTypeId: edu.degree_type_id, degreeTypeName: degreeType.name, institution: edu.institution, programName: edu.program_name, startDate: edu.start_date, endDate: edu.end_date };
  }

  async updateEducation(resumeId: string, educationId: string, userId: string, dto: UpdateEducationDto) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const edu = await this.educationRepo.findOne({ where: { id: educationId, resume_id: resumeId } });
    if (!edu) throw new AppError(404, 'Education not found');

    if (dto.degreeTypeId !== undefined) {
      const dt = await getDegreeTypeById(dto.degreeTypeId);
      if (!dt) throw new AppError(404, 'Degree type not found');
      edu.degree_type_id = dto.degreeTypeId;
    }
    if (dto.institution !== undefined) edu.institution = dto.institution;
    if (dto.programName !== undefined) edu.program_name = dto.programName ?? null;
    if (dto.startDate !== undefined) edu.start_date = dto.startDate ?? null;
    if (dto.endDate !== undefined) edu.end_date = dto.endDate ?? null;

    await this.educationRepo.save(edu);
    return { id: edu.id, degreeTypeId: edu.degree_type_id, institution: edu.institution, programName: edu.program_name, startDate: edu.start_date, endDate: edu.end_date };
  }

  async removeEducation(resumeId: string, educationId: string, userId: string) {
    const seeker = await this.requireSeeker(userId);
    const resume = await this.getResume(resumeId);
    this.assertOwner(resume, seeker.id);

    const edu = await this.educationRepo.findOne({ where: { id: educationId, resume_id: resumeId } });
    if (!edu) throw new AppError(404, 'Education not found');
    await this.educationRepo.remove(edu);
  }
}
