import { AppDataSource } from '../config/database';
import { Vacancy } from '../entities/Vacancy';
import { VacancySkill } from '../entities/VacancySkill';
import { getEmployerByUser, EmployerDto } from '../clients/user.client';
import { getSkillById } from '../clients/dictionary.client';
import { CreateVacancyDto, UpdateVacancyDto, AddVacancySkillDto } from '../dto/VacancyDto';
import { AppError } from '../utils/errors';

const companyRelation = { company: true } as const;
const fullRelations = { company: true, vacancySkills: true } as const;

function toShort(v: Vacancy) {
  return {
    id: v.id,
    title: v.title,
    company: v.company ? { id: v.company.id, name: v.company.name, logoUrl: v.company.logo_url } : null,
    cityId: v.city_id,
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
    industryId: v.industry_id,
    employmentTypeId: v.employment_type_id,
    experienceYearsMax: v.experience_years_max,
    isPublished: v.is_published,
    skills: (v.vacancySkills || []).map((vs) => ({ id: vs.id, skillId: vs.skill_id })),
    employerId: v.employer_id,
    createdAt: v.created_at,
  };
}

export class VacancyService {
  private vacancyRepo = AppDataSource.getRepository(Vacancy);
  private vacancySkillRepo = AppDataSource.getRepository(VacancySkill);

  private async requireEmployer(userId: string): Promise<EmployerDto> {
    const employer = await getEmployerByUser(userId);
    if (!employer) throw new AppError(404, 'Employer profile not found');
    return employer;
  }

  private async getVacancy(id: string) {
    const v = await this.vacancyRepo.findOne({ where: { id }, relations: fullRelations });
    if (!v) throw new AppError(404, 'Vacancy not found');
    return v;
  }

  async findAll(page = 1, limit = 20) {
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const [vacancies, total] = await this.vacancyRepo.findAndCount({
      where: { is_published: true },
      relations: companyRelation,
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
    const employer = await this.requireEmployer(userId);

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
    const employer = await this.requireEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    if (vacancy.employer_id !== employer.id) throw new AppError(403, 'Forbidden');

    if (dto.title !== undefined) vacancy.title = dto.title;
    if (dto.description !== undefined) vacancy.description = dto.description ?? null;
    if (dto.conditions !== undefined) vacancy.conditions = dto.conditions ?? null;
    if (dto.requirementsNote !== undefined) vacancy.requirements_note = dto.requirementsNote ?? null;
    if (dto.cityId !== undefined) vacancy.city_id = dto.cityId ?? null;
    if (dto.industryId !== undefined) vacancy.industry_id = dto.industryId ?? null;
    if (dto.employmentTypeId !== undefined) vacancy.employment_type_id = dto.employmentTypeId ?? null;
    if (dto.salaryType !== undefined) vacancy.salary_type = dto.salaryType;
    if (dto.salaryFixed !== undefined) vacancy.salary_fixed = dto.salaryFixed ?? null;
    if (dto.salaryMin !== undefined) vacancy.salary_min = dto.salaryMin ?? null;
    if (dto.salaryMax !== undefined) vacancy.salary_max = dto.salaryMax ?? null;
    if (dto.currency !== undefined) vacancy.currency = dto.currency;
    if (dto.experienceYearsMin !== undefined) vacancy.experience_years_min = dto.experienceYearsMin ?? null;
    if (dto.experienceYearsMax !== undefined) vacancy.experience_years_max = dto.experienceYearsMax ?? null;
    if (dto.isRemote !== undefined) vacancy.is_remote = dto.isRemote;
    if (dto.isPublished !== undefined) vacancy.is_published = dto.isPublished;

    await this.vacancyRepo.save(vacancy);
    return toDetail(await this.getVacancy(vacancyId));
  }

  async remove(vacancyId: string, userId: string) {
    const employer = await this.requireEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    if (vacancy.employer_id !== employer.id) throw new AppError(403, 'Forbidden');
    await this.vacancyRepo.remove(vacancy);
  }

  async addSkill(vacancyId: string, userId: string, dto: AddVacancySkillDto) {
    const employer = await this.requireEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    if (vacancy.employer_id !== employer.id) throw new AppError(403, 'Forbidden');

    const skill = await getSkillById(dto.skillId);
    if (!skill) throw new AppError(404, 'Skill not found');

    const existing = await this.vacancySkillRepo.findOne({
      where: { vacancy_id: vacancyId, skill_id: dto.skillId },
    });
    if (existing) throw new AppError(409, 'Skill already added');

    const vs = this.vacancySkillRepo.create({ vacancy_id: vacancyId, skill_id: dto.skillId });
    await this.vacancySkillRepo.save(vs);
    return { id: vs.id, skillId: vs.skill_id, skillName: skill.name };
  }

  async removeSkill(vacancyId: string, skillId: string, userId: string) {
    const employer = await this.requireEmployer(userId);
    const vacancy = await this.getVacancy(vacancyId);
    if (vacancy.employer_id !== employer.id) throw new AppError(403, 'Forbidden');

    const vs = await this.vacancySkillRepo.findOne({ where: { vacancy_id: vacancyId, skill_id: skillId } });
    if (!vs) throw new AppError(404, 'Skill not found in vacancy');
    await this.vacancySkillRepo.remove(vs);
  }

  async findByEmployer(userId: string, page = 1, limit = 20) {
    const employer = await this.requireEmployer(userId);
    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const [vacancies, total] = await this.vacancyRepo.findAndCount({
      where: { employer_id: employer.id },
      relations: companyRelation,
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    return { data: vacancies.map(toShort), total, page, limit: take };
  }
}
