import { AppError } from '../utils/errors';

const BASE = process.env.DICTIONARY_SERVICE_URL ?? 'http://dictionary-service:3000';
const SECRET = process.env.INTERNAL_SECRET!;

export interface SkillDto { id: string; name: string }
export interface DegreeTypeDto { id: string; name: string }

export async function getSkillById(id: string): Promise<SkillDto | null> {
  const res = await fetch(`${BASE}/internal/skills/${id}`, {
    headers: { 'X-Internal-Secret': SECRET },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new AppError(502, 'Dictionary service unavailable');
  return res.json() as Promise<SkillDto>;
}

export async function getDegreeTypeById(id: string): Promise<DegreeTypeDto | null> {
  const res = await fetch(`${BASE}/internal/degree-types/${id}`, {
    headers: { 'X-Internal-Secret': SECRET },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new AppError(502, 'Dictionary service unavailable');
  return res.json() as Promise<DegreeTypeDto>;
}
