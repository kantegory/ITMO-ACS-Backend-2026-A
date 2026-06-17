import { AppDataSource } from '../config/database';
import { Application } from '../entities/Application';
import { Resume } from '../entities/Resume';
import { Vacancy } from '../entities/Vacancy';
import { JobSeeker } from '../entities/JobSeeker';
import { Employer } from '../entities/Employer';
import { UserRole } from '../entities/User';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/ApplicationDto';
import { AppError } from '../utils/errors';

const appRelations = {
  resume: { jobSeeker: true },
  vacancy: { company: true, city: { country: true } },
} as const;

function toItem(a: Application) {
  const v = a.vacancy;
  return {
    id: a.id,
    vacancy: {
      id: v.id,
      title: v.title,
      company: v.company ? { id: v.company.id, name: v.company.name, logoUrl: v.company.logo_url } : null,
      city: v.city
        ? {
            id: v.city.id,
            name: v.city.name,
            country: v.city.country ? { id: v.city.country.id, name: v.city.country.name } : null,
          }
        : null,
      salaryType: v.salary_type,
      salaryFixed: v.salary_fixed,
      salaryMin: v.salary_min,
      salaryMax: v.salary_max,
      currency: v.currency,
      isRemote: v.is_remote,
      experienceYearsMin: v.experience_years_min,
      updatedAt: v.updated_at,
    },
    resume: {
      id: a.resume.id,
      title: a.resume.title,
      isPublished: a.resume.is_published,
      experienceMonths: a.resume.experience_months_cached,
      updatedAt: a.resume.updated_at,
    },
    coverLetter: a.cover_letter,
    status: a.status,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

export class ApplicationService {
  private appRepo = AppDataSource.getRepository(Application);
  private resumeRepo = AppDataSource.getRepository(Resume);
  private vacancyRepo = AppDataSource.getRepository(Vacancy);
  private seekerRepo = AppDataSource.getRepository(JobSeeker);
  private employerRepo = AppDataSource.getRepository(Employer);

  async create(userId: string, dto: CreateApplicationDto) {
    const seeker = await this.seekerRepo.findOne({ where: { user_id: userId } });
    if (!seeker) throw new AppError(404, 'Seeker profile not found');

    const resume = await this.resumeRepo.findOne({ where: { id: dto.resumeId } });
    if (!resume) throw new AppError(404, 'Resume not found');
    if (resume.job_seeker_id !== seeker.id) throw new AppError(403, 'Forbidden');

    const vacancy = await this.vacancyRepo.findOne({ where: { id: dto.vacancyId } });
    if (!vacancy) throw new AppError(404, 'Vacancy not found');

    const existing = await this.appRepo.findOne({
      where: { resume_id: dto.resumeId, vacancy_id: dto.vacancyId },
    });
    if (existing) throw new AppError(409, 'Already applied with this resume');

    const application = this.appRepo.create({
      resume_id: dto.resumeId,
      vacancy_id: dto.vacancyId,
      cover_letter: dto.coverLetter ?? null,
    });
    await this.appRepo.save(application);

    const saved = await this.appRepo.findOne({
      where: { id: application.id },
      relations: appRelations,
    });
    return toItem(saved!);
  }

  async findMy(userId: string) {
    const seeker = await this.seekerRepo.findOne({ where: { user_id: userId } });
    if (!seeker) throw new AppError(404, 'Seeker profile not found');

    const resumes = await this.resumeRepo.find({ where: { job_seeker_id: seeker.id } });
    if (!resumes.length) return [];

    const resumeIds = resumes.map((r) => r.id);
    const applications = await this.appRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.resume', 'resume')
      .leftJoinAndSelect('a.vacancy', 'vacancy')
      .leftJoinAndSelect('vacancy.company', 'company')
      .leftJoinAndSelect('vacancy.city', 'city')
      .leftJoinAndSelect('city.country', 'country')
      .leftJoinAndSelect('resume.jobSeeker', 'jobSeeker')
      .where('a.resume_id IN (:...ids)', { ids: resumeIds })
      .orderBy('a.created_at', 'DESC')
      .getMany();

    return applications.map(toItem);
  }

  async findOne(applicationId: string, userId: string, role: string) {
    const application = await this.appRepo.findOne({
      where: { id: applicationId },
      relations: appRelations,
    });
    if (!application) throw new AppError(404, 'Application not found');

    if (role === UserRole.SEEKER) {
      const seeker = await this.seekerRepo.findOne({ where: { user_id: userId } });
      if (!seeker || application.resume.job_seeker_id !== seeker.id) {
        throw new AppError(403, 'Forbidden');
      }
    } else if (role === UserRole.EMPLOYER) {
      const employer = await this.employerRepo.findOne({ where: { user_id: userId } });
      if (!employer) throw new AppError(403, 'Forbidden');
      const vacancy = await this.vacancyRepo.findOne({ where: { id: application.vacancy_id } });
      if (!vacancy || vacancy.employer_id !== employer.id) throw new AppError(403, 'Forbidden');
    }

    return toItem(application);
  }

  async updateStatus(applicationId: string, userId: string, dto: UpdateApplicationStatusDto) {
    const employer = await this.employerRepo.findOne({ where: { user_id: userId } });
    if (!employer) throw new AppError(403, 'Forbidden');

    const application = await this.appRepo.findOne({
      where: { id: applicationId },
      relations: appRelations,
    });
    if (!application) throw new AppError(404, 'Application not found');

    const vacancy = await this.vacancyRepo.findOne({ where: { id: application.vacancy_id } });
    if (!vacancy || vacancy.employer_id !== employer.id) throw new AppError(403, 'Forbidden');

    application.status = dto.status;
    await this.appRepo.save(application);

    return toItem(application);
  }
}
