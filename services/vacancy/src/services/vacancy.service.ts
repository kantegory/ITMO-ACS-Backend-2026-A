import { AppDataSource } from "../data-source";
import { Company } from "../entities/Company";
import { Vacancy, VacancyStatus } from "../entities/Vacancy";
import { validateUser } from "../clients/authClient";
import { publishVacancyPublished } from "../messaging/publisher";
import { badRequest, forbidden, notFound } from "../utils/errors";

const companyRepo = () => AppDataSource.getRepository(Company);
const vacancyRepo = () => AppDataSource.getRepository(Vacancy);

export type VacancyFilter = {
  industry?: string;
  salaryFrom?: number;
  salaryTo?: number;
  experienceLevel?: string;
  location?: string;
  employmentType?: string;
  limit?: number;
  offset?: number;
};

export class VacancyService {
  static async listPublished(filter: VacancyFilter) {
    const limit = Math.min(Math.max(filter.limit || 20, 1), 100);
    const offset = Math.max(filter.offset || 0, 0);

    const qb = vacancyRepo()
      .createQueryBuilder("v")
      .where("v.status = :status", { status: "published" });

    if (filter.industry) qb.andWhere("v.industry = :industry", { industry: filter.industry });
    if (filter.experienceLevel) {
      qb.andWhere("v.experience_level = :exp", { exp: filter.experienceLevel });
    }
    if (filter.employmentType) {
      qb.andWhere("v.employment_type = :et", { et: filter.employmentType });
    }
    if (filter.location) {
      qb.andWhere("v.location ILIKE :loc", { loc: `%${filter.location}%` });
    }
    if (filter.salaryFrom != null) {
      qb.andWhere("coalesce(v.salary_to, v.salary_from, 0) >= :sf", { sf: filter.salaryFrom });
    }
    if (filter.salaryTo != null) {
      qb.andWhere("coalesce(v.salary_from, v.salary_to, 0) <= :st", { st: filter.salaryTo });
    }

    return qb.orderBy("v.created_at", "DESC").take(limit).skip(offset).getMany();
  }

  static async getPublishedDetails(id: string) {
    const vacancy = await vacancyRepo().findOneBy({ id });
    if (!vacancy || vacancy.status !== "published") throw notFound();
    const company = await companyRepo().findOneBy({ id: vacancy.companyId });
    if (!company) throw notFound();
    return { vacancy, company };
  }

  static async getCompanyById(id: string) {
    const company = await companyRepo().findOneBy({ id });
    if (!company) throw notFound();
    return company;
  }

  static async upsertCompany(ownerId: string, data: Partial<Company>) {
    await validateUser(ownerId, "employer");
    let company = await companyRepo().findOne({ where: { ownerId } });
    if (!company) {
      company = companyRepo().create({ ownerId });
    }
    company.name = data.name!.trim();
    company.description = data.description?.trim() || null;
    company.website = data.website?.trim() || null;
    company.industry = data.industry!.trim();
    return companyRepo().save(company);
  }

  static async employerVacancies(ownerId: string) {
    await validateUser(ownerId, "employer");
    const company = await companyRepo().findOne({ where: { ownerId } });
    if (!company) throw notFound();
    return vacancyRepo().find({
      where: { companyId: company.id },
      order: { createdAt: "DESC" },
    });
  }

  static async createVacancy(ownerId: string, data: Partial<Vacancy>) {
    await validateUser(ownerId, "employer");
    const company = await companyRepo().findOne({ where: { ownerId } });
    if (!company) throw notFound();
    validateSalary(data.salaryFrom, data.salaryTo);
    const vacancy = vacancyRepo().create({
      companyId: company.id,
      title: data.title!,
      description: data.description!,
      requirements: data.requirements!,
      industry: data.industry!,
      salaryFrom: data.salaryFrom ?? null,
      salaryTo: data.salaryTo ?? null,
      experienceLevel: data.experienceLevel!,
      location: data.location || null,
      employmentType: data.employmentType!,
      status: (data.status as VacancyStatus) || "draft",
    });
    const saved = await vacancyRepo().save(vacancy);
    if (saved.status === "published") {
      await publishVacancyPublished(saved);
    }
    return saved;
  }

  static async updateVacancy(ownerId: string, vacancyId: string, data: Partial<Vacancy>) {
    await validateUser(ownerId, "employer");
    const company = await companyRepo().findOne({ where: { ownerId } });
    if (!company) throw notFound();
    const vacancy = await vacancyRepo().findOneBy({ id: vacancyId });
    if (!vacancy) throw notFound();
    if (vacancy.companyId !== company.id) throw forbidden();
    validateSalary(data.salaryFrom ?? vacancy.salaryFrom, data.salaryTo ?? vacancy.salaryTo);

    const prevStatus = vacancy.status;
    Object.assign(vacancy, {
      title: data.title ?? vacancy.title,
      description: data.description ?? vacancy.description,
      requirements: data.requirements ?? vacancy.requirements,
      industry: data.industry ?? vacancy.industry,
      salaryFrom: data.salaryFrom !== undefined ? data.salaryFrom : vacancy.salaryFrom,
      salaryTo: data.salaryTo !== undefined ? data.salaryTo : vacancy.salaryTo,
      experienceLevel: data.experienceLevel ?? vacancy.experienceLevel,
      location: data.location !== undefined ? data.location : vacancy.location,
      employmentType: data.employmentType ?? vacancy.employmentType,
      status: (data.status as VacancyStatus) ?? vacancy.status,
    });
    const saved = await vacancyRepo().save(vacancy);
    if (saved.status === "published" && prevStatus !== "published") {
      await publishVacancyPublished(saved);
    }
    return saved;
  }
}

function validateSalary(from: number | null | undefined, to: number | null | undefined) {
  if (from != null && to != null && from > to) throw badRequest();
}
