import { NextFunction, Request, Response } from 'express';
import { GATEWAY_TOKEN, SERVICE_TOKEN } from './env';
import { HttpError } from './http';

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: number;
    role: string;
  };
}

export function requireInternalToken(req: Request, _res: Response, next: NextFunction): void {
  if (req.header('x-service-token') !== SERVICE_TOKEN) {
    next(new HttpError(401, 'Invalid or missing service token', 'INVALID_SERVICE_TOKEN'));
    return;
  }
  next();
}

export function requireGatewayUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (req.header('x-gateway-token') !== GATEWAY_TOKEN) {
    next(new HttpError(401, 'Request must come through API Gateway', 'INVALID_GATEWAY_TOKEN'));
    return;
  }

  const userId = Number(req.header('x-user-id'));
  const role = req.header('x-user-role') ?? '';
  if (!Number.isInteger(userId) || userId < 1 || !role) {
    next(new HttpError(401, 'Authenticated user context is missing', 'AUTH_CONTEXT_MISSING'));
    return;
  }

  req.authUser = { id: userId, role };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      next(new HttpError(403, `Required role: ${roles.join(' or ')}`, 'FORBIDDEN'));
      return;
    }
    next();
  };
}

export function currentUser(req: AuthenticatedRequest): { id: number; role: string } {
  if (!req.authUser) {
    throw new HttpError(401, 'Authenticated user context is missing', 'AUTH_CONTEXT_MISSING');
  }
  return req.authUser;
}
