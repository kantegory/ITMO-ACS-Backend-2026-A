import { AppError } from '../utils/errors';

const BASE = process.env.USER_SERVICE_URL || 'http://user-service:3000';
const SECRET = process.env.INTERNAL_SECRET || 'internal_secret';

export interface SeekerDto {
  id: string;
  userId: string;
  cityId: string;
  firstName: string;
  lastName: string;
}

export interface EmployerDto {
  id: string;
  userId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  position: string;
}

export async function getSeekerByUser(userId: string): Promise<SeekerDto | null> {
  try {
    const res = await fetch(`${BASE}/internal/seekers/by-user/${userId}`, {
      headers: { 'X-Internal-Secret': SECRET },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new AppError(502, 'User service unavailable');

    return res.json() as Promise<SeekerDto>;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'User service unavailable');
  }
}

export async function getEmployerByUser(userId: string): Promise<EmployerDto | null> {
  try {
    const res = await fetch(`${BASE}/internal/employers/by-user/${userId}`, {
      headers: { 'X-Internal-Secret': SECRET },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new AppError(502, 'User service unavailable');

    return res.json() as Promise<EmployerDto>;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'User service unavailable');
  }
}
