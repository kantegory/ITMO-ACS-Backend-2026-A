import { AppError } from '../utils/errors';

const BASE = process.env.DICTIONARY_SERVICE_URL ?? 'http://dictionary-service:3000';
const SECRET = process.env.INTERNAL_SECRET!;

export interface CityDto {
  id: string;
  name: string;
  country: { id: string; name: string };
}

export async function getCityById(id: string): Promise<CityDto | null> {
  const res = await fetch(`${BASE}/internal/cities/${id}`, {
    headers: { 'X-Internal-Secret': SECRET },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new AppError(502, 'Dictionary service unavailable');
  return res.json() as Promise<CityDto>;
}
