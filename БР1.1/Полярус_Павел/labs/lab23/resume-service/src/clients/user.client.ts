import { AppError } from '../utils/errors';

const BASE = process.env.USER_SERVICE_URL ?? 'http://user-service:3000';
const SECRET = process.env.INTERNAL_SECRET!;

export interface SeekerDto {
  id: string;
  userId: string;
  cityId: string;
  firstName: string;
  lastName: string;
}

export async function getSeekerByUser(userId: string): Promise<SeekerDto | null> {
  const res = await fetch(`${BASE}/internal/seekers/by-user/${userId}`, {
    headers: { 'X-Internal-Secret': SECRET },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new AppError(502, 'User service unavailable');
  return res.json() as Promise<SeekerDto>;
}
