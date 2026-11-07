import { RequestWithUser } from '../middlewares/auth.middleware';
import { ensureForbidden } from './http-errors';
import { UserRole } from '../models/enums/user-role.enum';

export const hasRole = (role: UserRole, allowedRoles: UserRole[]) =>
    allowedRoles.includes(role);

export const requireRole = (
    request: RequestWithUser,
    allowedRoles: UserRole[],
): void => {
    ensureForbidden(
        hasRole(request.user.role, allowedRoles),
        'Insufficient permissions',
    );
};

export const isAdmin = (request: RequestWithUser): boolean =>
    request.user.role === UserRole.ADMIN;
