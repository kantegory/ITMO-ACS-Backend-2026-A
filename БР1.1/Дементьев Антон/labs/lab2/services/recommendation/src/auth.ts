import { jwksFromIdentity, makeUserAuth, requireRole } from '@jobsearch/common';

export const jwks = jwksFromIdentity();
export const { authMiddleware, optionalAuthMiddleware } = makeUserAuth(jwks);
export { requireRole };
export type { RequestWithUser } from '@jobsearch/common';
