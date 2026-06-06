import { AppError } from '../utils/errors';

const BASE = process.env.VACANCY_SERVICE_URL || 'http://vacancy-service:3000';
const SECRET = process.env.INTERNAL_SECRET || 'internal_secret';

export interface VacancyDto {
  id: string;
  title: string;
  employerId: string;
  companyId: string;
  isPublished: boolean;
}

export async function getVacancyById(vacancyId: string): Promise<VacancyDto | null> {
  try {
    const res = await fetch(`${BASE}/internal/vacancies/${vacancyId}`, {
      headers: { 'X-Internal-Secret': SECRET },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new AppError(502, 'Vacancy service unavailable');

    return res.json() as Promise<VacancyDto>;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'Vacancy service error');
  }
}