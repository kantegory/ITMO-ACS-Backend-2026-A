import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { RevokedToken } from '../models/revoked-token.entity';

interface JwtPayloadWithUser extends JwtPayload {
  user: {
    id: number;
    role?: string;
  };
}

interface RequestWithUser extends Request {
  user: {
    id: number;
    role?: string;
  };
  accessToken?: string;
}

const authMiddleware = async (
  request: RequestWithUser,
  response: Response,
  next: NextFunction,
) => {
  const { authorization } = request.headers;

  try {
    if (!authorization) {
      return response.status(401).send({ message: 'Unauthorized: no token provided' });
    }

    const parts = authorization.split(' ');
    const accessToken = parts.length === 2 ? parts[1] : '';

    if (!accessToken) {
      return response.status(401).send({ message: 'Unauthorized: no token provided' });
    }

    const revokedTokenRepository = dataSource.getRepository(RevokedToken);
    const revokedToken = await revokedTokenRepository.findOneBy({ token: accessToken });

    if (revokedToken) {
      return response.status(401).send({ message: 'Unauthorized: token has been revoked' });
    }

    const { user } = jwt.verify(
      accessToken,
      SETTINGS.JWT_SECRET_KEY,
    ) as JwtPayloadWithUser;

    request.user = user;
    request.accessToken = accessToken;

    next();
  } catch (error) {
    console.error(error);
    return response.status(403).send({ message: 'Forbidden: token is invalid or expired' });
  }
};

export { JwtPayloadWithUser, RequestWithUser };
export default authMiddleware;