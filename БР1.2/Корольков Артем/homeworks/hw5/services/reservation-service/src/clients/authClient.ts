import { AUTH_SERVICE_URL } from '../../../shared/src/config';
import { serviceFetch } from '../../../shared/src/http';

type AuthUser = { id: number; name: string; email: string; role: string };

export async function verifyBearerToken(token: string): Promise<AuthUser | null> {
  const response = await serviceFetch(`${AUTH_SERVICE_URL}/internal/auth/verify`, {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { valid?: boolean; user?: AuthUser };
  return payload.valid && payload.user ? payload.user : null;
}
