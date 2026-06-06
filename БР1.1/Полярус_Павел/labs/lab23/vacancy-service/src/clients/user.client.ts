import { AppError } from '../utils/errors';

const BASE = process.env.USER_SERVICE_URL ?? 'http://user-service:3000';
const SECRET = process.env.INTERNAL_SECRET!;

export interface EmployerDto {
  id: string;
  userId: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  position: string | null;
}

export async function getEmployerByUser(userId: string): Promise<EmployerDto | null> {
  const res = await fetch(`${BASE}/internal/employers/by-user/${userId}`, {
    headers: { 'X-Internal-Secret': SECRET },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new AppError(502, 'User service unavailable');
  return res.json() as Promise<EmployerDto>;
}
