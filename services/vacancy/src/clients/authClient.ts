import { env } from "../config/env";
import { forbidden, unauthorized } from "../utils/errors";

export async function validateUser(userId: string, role?: string): Promise<void> {
  const url = new URL(`/internal/users/${userId}/validate`, env.authServiceUrl);
  if (role) url.searchParams.set("role", role);

  const res = await fetch(url.toString(), {
    headers: { "X-Service-Token": env.serviceToken },
  });

  if (res.status === 401) throw unauthorized();
  if (res.status === 403) throw forbidden();
  if (res.status === 404) throw unauthorized();
  if (!res.ok) throw new Error(`auth service error: ${res.status}`);
}
