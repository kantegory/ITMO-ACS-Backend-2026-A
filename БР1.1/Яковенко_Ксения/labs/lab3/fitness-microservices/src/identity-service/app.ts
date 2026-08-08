import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { envInt, envString } from '../shared/env';
import { createServiceApp, finishServiceApp } from '../shared/app';
import { asyncHandler, HttpError, optionalString, requireString } from '../shared/http';
import {
  AuthenticatedRequest,
  currentUser,
  requireGatewayUser,
  requireInternalToken,
} from '../shared/auth-context';
import { startService } from '../shared/start';
import { identityDataSource } from './data-source';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { RevokedToken } from './entities/revoked-token.entity';

const app = createServiceApp('identity-service');
const port = envInt('IDENTITY_PORT', 3001);
const jwtSecret = envString('JWT_SECRET_KEY', 'change-me');
const accessLifetime = envInt('JWT_ACCESS_TOKEN_LIFETIME_SECONDS', 900);
const refreshLifetime = envInt('JWT_REFRESH_TOKEN_LIFETIME_SECONDS', 604800);

interface TokenPayload extends JwtPayload {
  user: { id: number; role: string };
  tokenType: 'access' | 'refresh';
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signToken(user: User, tokenType: 'access' | 'refresh'): string {
  return jwt.sign({ user: { id: user.id, role: user.role }, tokenType }, jwtSecret, {
    expiresIn: tokenType === 'access' ? accessLifetime : refreshLifetime,
  });
}

async function isRevoked(token: string): Promise<boolean> {
  const repository = identityDataSource.getRepository(RevokedToken);
  const revoked = await repository.findOneBy({ token });
  return Boolean(revoked);
}

async function decodeAndValidate(token: string, expectedType?: 'access' | 'refresh') {
  if (await isRevoked(token)) {
    throw new HttpError(401, 'Token has been revoked', 'TOKEN_REVOKED');
  }

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, jwtSecret) as TokenPayload;
  } catch {
    throw new HttpError(401, 'Token is invalid or expired', 'INVALID_TOKEN');
  }

  if (expectedType && payload.tokenType !== expectedType) {
    throw new HttpError(401, `Expected ${expectedType} token`, 'INVALID_TOKEN_TYPE');
  }

  const user = await identityDataSource.getRepository(User).findOneBy({ id: payload.user.id });
  if (!user || user.status !== 'active') {
    throw new HttpError(401, 'User is not active', 'USER_NOT_ACTIVE');
  }

  return { payload, user };
}

app.post(
  '/api/auth/register',
  asyncHandler(async (req, res) => {
    const email = requireString(req.body.email, 'email').toLowerCase();
    const password = requireString(req.body.password, 'password');
    const firstName = requireString(req.body.firstName, 'firstName');
    const lastName = requireString(req.body.lastName, 'lastName');

    if (!email.includes('@')) {
      throw new HttpError(422, 'email must be valid', 'VALIDATION_ERROR');
    }
    if (password.length < 8) {
      throw new HttpError(422, 'password must contain at least 8 characters', 'VALIDATION_ERROR');
    }

    const userRepository = identityDataSource.getRepository(User);
    if (await userRepository.findOneBy({ email })) {
      throw new HttpError(409, 'User with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const user = await userRepository.save(
      userRepository.create({
        email,
        password: await bcrypt.hash(password, 10),
        role: 'user',
        status: 'active',
      }),
    );

    const profileRepository = identityDataSource.getRepository(UserProfile);
    const profile = await profileRepository.save(
      profileRepository.create({
        userId: user.id,
        firstName,
        lastName,
        birthDate: optionalString(req.body.birthDate),
        heightCm: req.body.heightCm === undefined ? undefined : Number(req.body.heightCm),
        fitnessGoal: optionalString(req.body.fitnessGoal),
      }),
    );

    res.status(201).json({ user: publicUser(user), profile });
  }),
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const email = requireString(req.body.email, 'email').toLowerCase();
    const password = requireString(req.body.password, 'password');
    const userRepository = identityDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new HttpError(400, 'Password or email is incorrect', 'INVALID_CREDENTIALS');
    }
    if (user.status !== 'active') {
      throw new HttpError(403, 'User is blocked', 'USER_BLOCKED');
    }

    const profile = await identityDataSource
      .getRepository(UserProfile)
      .findOneBy({ userId: user.id });
    res.json({
      accessToken: signToken(user, 'access'),
      refreshToken: signToken(user, 'refresh'),
      user: publicUser(user),
      profile,
    });
  }),
);

app.post(
  '/api/auth/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = requireString(req.body.refreshToken, 'refreshToken');
    const { user } = await decodeAndValidate(refreshToken, 'refresh');
    res.json({ accessToken: signToken(user, 'access') });
  }),
);

app.post(
  '/api/auth/logout',
  asyncHandler(async (req, res) => {
    const tokens: string[] = [];
    const authorization = req.header('authorization');
    if (authorization?.startsWith('Bearer ')) tokens.push(authorization.slice(7));
    if (typeof req.body.refreshToken === 'string') tokens.push(req.body.refreshToken);
    if (tokens.length === 0) {
      throw new HttpError(400, 'No token was provided', 'TOKEN_MISSING');
    }

    const repository = identityDataSource.getRepository(RevokedToken);
    for (const token of tokens) {
      if (await repository.findOneBy({ token })) continue;
      const decoded = jwt.decode(token) as JwtPayload | null;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 3600000);
      await repository.save(repository.create({ token, expiresAt }));
    }

    res.json({ success: true });
  }),
);

app.get(
  '/api/users/me',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = currentUser(req);
    const user = await identityDataSource.getRepository(User).findOneBy({ id });
    if (!user) throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    const profile = await identityDataSource.getRepository(UserProfile).findOneBy({ userId: id });
    res.json({ user: publicUser(user), profile });
  }),
);

app.patch(
  '/api/users/me/profile',
  requireGatewayUser,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = currentUser(req);
    const repository = identityDataSource.getRepository(UserProfile);
    const profile = await repository.findOneBy({ userId: id });
    if (!profile) throw new HttpError(404, 'Profile not found', 'PROFILE_NOT_FOUND');

    const fields = [
      'firstName',
      'lastName',
      'birthDate',
      'heightCm',
      'fitnessGoal',
      'avatarUrl',
      'about',
    ];
    for (const field of fields) {
      if (req.body[field] !== undefined)
        (profile as unknown as Record<string, unknown>)[field] = req.body[field];
    }
    await repository.save(profile);
    res.json({ profile });
  }),
);

app.post(
  '/api/internal/tokens/verify',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const headerToken = req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const token = headerToken || req.body.token;
    if (typeof token !== 'string' || !token) {
      throw new HttpError(401, 'Token is missing', 'TOKEN_MISSING');
    }
    const { user } = await decodeAndValidate(token, 'access');
    res.json({ userId: user.id, role: user.role, status: user.status });
  }),
);

app.get(
  '/api/internal/users/:userId',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.userId);
    const user = await identityDataSource.getRepository(User).findOneBy({ id });
    if (!user) throw new HttpError(404, 'User not found', 'USER_NOT_FOUND');
    res.json({ user: publicUser(user) });
  }),
);

finishServiceApp(app);

void startService(app, identityDataSource, port, 'identity-service').catch((error) => {
  console.error(error);
  process.exit(1);
});
