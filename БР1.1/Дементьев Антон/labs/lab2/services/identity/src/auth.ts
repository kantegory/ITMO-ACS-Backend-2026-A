import { Jwks, makeUserAuth, requireRole } from '@jobsearch/common';
import { jwks } from './keys';

// В самом Identity ключи берутся напрямую, без HTTP
export const jwksSource = new Jwks(jwks);
export const { authMiddleware, optionalAuthMiddleware } = makeUserAuth(jwksSource);
export { requireRole };
export type { RequestWithUser } from '@jobsearch/common';
