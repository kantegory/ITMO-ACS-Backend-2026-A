import { AppDataSource } from '../config/database';
import { Vacancy } from '../entities/Vacancy';
import { VacancySkill } from '../entities/VacancySkill';
import { Employer } from '../entities/Employer';
import { Skill } from '../entities/Skill';
import { Application } from '../entities/Application';
import { CreateVacancyDto, UpdateVacancyDto, AddVacancySkillDto } from '../dto/VacancyDto';
import { AppError } from '../utils/errors';

const vacancyRelations = {
  company: true,
  city: { country: true },
  industry: true,
  employmentType: true,
  vacancySkills: { skill: true },
  employer: true,
} as const;

function toShort(v: Vacancy) {
  return {
    id: v.id,
    title: v.title,
    company: v.company
      ? { id: v.company.id, name: v.company.name, logoUrl: v.company.logo_url }
      : null,
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
  };
}

function toDetail(v: Vacancy) {
  return {
    ...toShort(v),
    description: v.description,
    conditions: v.conditions,
    requirementsNote: v.requirements_note,
    experienceYearsMax: v.experience_years_max,
    employmentType: v.employmentType
      ? { id: v.employmentType.id, name: v.employmentType.name }
      : null,
    industry: v.industry ? { id: v.industry.id, name: v.industry.name } : null,
    skills: (v.vacancySkills || []).map((vs) => ({
      id: vs.id,
      skill: { id: vs.skill.id, name: vs.skill.name },
    })),
    employer: v.employer
      ? {
          id: v.employer.id,
          firstName: v.employer.first_name,
          lastName: v.employer.last_name,
          position: v.employer.position,
        }
      : null,
    createdAt: v.created_at,
  };
}

export class VacancyService {
  private vacancyRepo = AppDataSource.getRepository(Vacancy);
  private vacancySkillRepo = AppDataSource.getRepository(VacancySkill);
  private employerRepo = AppDataSource.getRepository(Employer);
  private skillRepo = AppDataSource.getRepository(Skill);
  private applicationRepo = AppDataSource.getRepository(Application);

  private async getVacancy(id: string) {
    const vacancy = await this.vacancyRepo.findOne({ where: { id }, relations: vacancyRelations });
    if (!vacancy) throw new AppError(404, 'Vacancy not found');
    return vacancy;
  }

  private async getEmployer(userId: string) {
    const employer = await this.employerRepo.findOne({ where: { user_id: userId } });
    if (!employer) throw new AppError(404, 'Employer profile not found');
    return employer;
  }

  private assertOwner(vacancy: Vacancy, employer: Employer) {
    if (vacancy.employer_id !== employer.id) throw new AppError(403, 'Forbidden');
  }

  async findAll(page = 1, limit = 20) {
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const [vacancies, total] = await this.vacancyRepo.findAndCount({
      where: { is_published: true },
      relations: { company: true, city: { country: true } },
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return { data: vacancies.map(toShort), total, page, limit: take };
  }

  async findOne(id: string) {
    return toDetail(await this.getVacancy(id));
  }

  async create(userId: string, dto: CreateVacancyDto) {
    const employer = await this.getEmployer(userId);

    const vacancy = this.vacancyRepo.create({
      employer_id: employer.id,
      company_id: dto.companyId,
      title: dto.title,
      description: dto.description ?? null,
      conditions: dto.conditions ?? null,
      requirements_note: dto.requirementsNote ?? null,
      city_id: dto.cityId ?? null,
      industry_id: dto.industryId ?? null,
      employment_type_id: dto.employmentTypeId ?? null,
      salary_type: dto.salaryType,
      salary_fixed: dto.salaryFixed ?? null,
      salary_min: dto.salaryMin ?? null,
      salary_max: dto.salaryMax ?? null,
      currency: dto.currency ?? 'RUB',
      experience_years_min: dto.experienceYearsMin ?? null,
      experience_years_max: dto.experienceYearsMax ?? null,
      is_remote: dto.isRemote ?? false,
      is_published: dto.isPublished ?? false,
    });
    await this.vacancyRepo.save(vacancy);

    if (dto.skills?.length) {
      const skillEntities = dto.skills.map((s) =>
        this.vacancySkillRepo.create({ vacancy_id: vacancy.id, skill_id: s.skillId }),
      );
      await this.vacancySkillRepo.save(skillEntities);
    }

    return toDetail(await this.getVacancy(vacancy.id));
  }

  async update(vacancyId: string, userId: string, dto: UpdateVacancyDto) {
    const employer = await this.getEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    this.assertOwner(vacancy, employer);

    if (dto.title !== undefined) vacancy.title = dto.title;
    if (dto.description !== undefined) vacancy.description = dto.description;
    if (dto.conditions !== undefined) vacancy.conditions = dto.conditions;
    if (dto.requirementsNote !== undefined) vacancy.requirements_note = dto.requirementsNote;
    if (dto.cityId !== undefined) vacancy.city_id = dto.cityId;
    if (dto.industryId !== undefined) vacancy.industry_id = dto.industryId;
    if (dto.employmentTypeId !== undefined) vacancy.employment_type_id = dto.employmentTypeId;
    if (dto.salaryType !== undefined) vacancy.salary_type = dto.salaryType;
    if (dto.salaryFixed !== undefined) vacancy.salary_fixed = dto.salaryFixed;
    if (dto.salaryMin !== undefined) vacancy.salary_min = dto.salaryMin;
    if (dto.salaryMax !== undefined) vacancy.salary_max = dto.salaryMax;
    if (dto.currency !== undefined) vacancy.currency = dto.currency;
    if (dto.experienceYearsMin !== undefined) vacancy.experience_years_min = dto.experienceYearsMin;
    if (dto.experienceYearsMax !== undefined) vacancy.experience_years_max = dto.experienceYearsMax;
    if (dto.isRemote !== undefined) vacancy.is_remote = dto.isRemote;
    if (dto.isPublished !== undefined) vacancy.is_published = dto.isPublished;

    await this.vacancyRepo.save(vacancy);
    return toDetail(await this.getVacancy(vacancyId));
  }

  async remove(vacancyId: string, userId: string) {
    const employer = await this.getEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    this.assertOwner(vacancy, employer);
    await this.vacancyRepo.remove(vacancy);
  }

  async addSkill(vacancyId: string, userId: string, dto: AddVacancySkillDto) {
    const employer = await this.getEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    this.assertOwner(vacancy, employer);

    const skill = await this.skillRepo.findOne({ where: { id: dto.skillId } });
    if (!skill) throw new AppError(404, 'Skill not found');

    const existing = await this.vacancySkillRepo.findOne({
      where: { vacancy_id: vacancyId, skill_id: dto.skillId },
    });
    if (existing) throw new AppError(409, 'Skill already added to this vacancy');

    const vs = this.vacancySkillRepo.create({ vacancy_id: vacancyId, skill_id: dto.skillId });
    await this.vacancySkillRepo.save(vs);

    return { id: vs.id, skill: { id: skill.id, name: skill.name } };
  }

  async removeSkill(vacancyId: string, skillId: string, userId: string) {
    const employer = await this.getEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    this.assertOwner(vacancy, employer);

    const vs = await this.vacancySkillRepo.findOne({
      where: { vacancy_id: vacancyId, skill_id: skillId },
    });
    if (!vs) throw new AppError(404, 'Skill not found in vacancy');
    await this.vacancySkillRepo.remove(vs);
  }

  async getApplications(vacancyId: string, userId: string) {
    const employer = await this.getEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    this.assertOwner(vacancy, employer);

    const applications = await this.applicationRepo.find({
      where: { vacancy_id: vacancyId },
      relations: {
        resume: { jobSeeker: true },
        vacancy: { company: true, city: { country: true } },
      },
      order: { created_at: 'DESC' },
    });

    return applications.map((a) => ({
      id: a.id,
      vacancy: toShort(a.vacancy),
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
    }));
  }

  async findByEmployer(userId: string, page = 1, limit = 20) {
    const employer = await this.getEmployer(userId);
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const [vacancies, total] = await this.vacancyRepo.findAndCount({
      where: { employer_id: employer.id },
      relations: { company: true, city: { country: true } },
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return { data: vacancies.map(toShort), total, page, limit: take };
  }
}
