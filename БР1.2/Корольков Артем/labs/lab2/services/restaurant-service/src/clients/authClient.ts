import { AUTH_SERVICE_URL } from '../../../shared/src/config';
import { serviceFetch } from '../../../shared/src/http';

export async function fetchUserName(userId: number): Promise<string | null> {
  const response = await serviceFetch(`${AUTH_SERVICE_URL}/internal/users/${userId}`);
  if (!response.ok) return null;
  const user = (await response.json()) as { name?: string };
  return user.name ?? null;
}
