import 'reflect-metadata';

import cors from 'cors';
import express from 'express';

import { asyncHandler } from '../shared/async-handler';
import { createAccessToken, requireServiceToken, requireUser, RequestWithUser } from '../shared/auth';
import {
    badRequest,
    conflict,
    errorHandler,
    notFound,
    notFoundHandler,
    unauthorized,
} from '../shared/errors';
import { checkPassword, hashPassword } from '../shared/password';
import SETTINGS from '../shared/settings';
import { mountInternalSwagger } from '../shared/swagger';
import authDataSource from './data-source';
import { User } from './entities/user.entity';

type RegisterPayload = {
    username?: unknown;
    email?: unknown;
    password?: unknown;
};

type LoginPayload = {
    username?: unknown;
    password?: unknown;
};

type UpdateProfilePayload = {
    bio?: unknown;
    avatarUrl?: unknown;
};

type ChangePasswordPayload = {
    currentPassword?: unknown;
    newPassword?: unknown;
};

const userRepository = () => authDataSource.getRepository(User);

const isString = (value: unknown): value is string => typeof value === 'string';

const assertString = (
    value: unknown,
    field: string,
    minLength = 1,
    maxLength = Number.MAX_SAFE_INTEGER,
): string => {
    if (!isString(value) || value.length < minLength || value.length > maxLength) {
        throw badRequest(`${field} must be a string from ${minLength} to ${maxLength} characters`);
    }

    return value;
};

const toUserProfile = (user: User) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
});

const toPublicUser = (user: User) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
});

const toAuthResponse = (user: User) => ({
    accessToken: createAccessToken(user.id),
    tokenType: SETTINGS.JWT_TOKEN_TYPE,
    expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
    user: toUserProfile(user),
});

const validateRegister = (payload: RegisterPayload) => {
    const username = assertString(payload.username, 'username', 3, 50);
    const email = assertString(payload.email, 'email', 5, 255);
    const password = assertString(payload.password, 'password', 8, 72);

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw badRequest('username can only contain latin letters, numbers and underscore');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw badRequest('email must be a valid email address');
    }

    return { username, email, password };
};

const validateLogin = (payload: LoginPayload) => ({
    username: assertString(payload.username, 'username'),
    password: assertString(payload.password, 'password'),
});

const getCurrentUser = async (request: RequestWithUser): Promise<User> => {
    if (!request.user?.id) {
        throw unauthorized('User token is missing');
    }

    const user = await userRepository().findOneBy({ id: request.user.id });

    if (!user) {
        throw unauthorized('User from token is not found');
    }

    return user;
};

const app = express();

app.use(cors());
app.use(express.json());

mountInternalSwagger(app);

app.get('/health', (_request, response) => {
    response.json({ service: 'auth-service', status: 'ok' });
});

app.post(
    `${SETTINGS.APP_API_PREFIX}/auth/register`,
    asyncHandler(async (request, response) => {
        const payload = validateRegister(request.body as RegisterPayload);
        const existingUser = await userRepository()
            .createQueryBuilder('user')
            .where('user.username = :username', { username: payload.username })
            .orWhere('user.email = :email', { email: payload.email })
            .getOne();

        if (existingUser) {
            throw conflict('Username or email already in use');
        }

        const user = userRepository().create({
            username: payload.username,
            email: payload.email,
            passwordHash: hashPassword(payload.password),
            bio: null,
            avatarUrl: null,
        });

        const savedUser = await userRepository().save(user);

        response.status(201).json(toAuthResponse(savedUser));
    }),
);

app.post(
    `${SETTINGS.APP_API_PREFIX}/auth/login`,
    asyncHandler(async (request, response) => {
        const payload = validateLogin(request.body as LoginPayload);
        const user = await userRepository().findOneBy({ username: payload.username });

        if (!user || !checkPassword(user.passwordHash, payload.password)) {
            throw unauthorized('Username or password is incorrect');
        }

        response.json(toAuthResponse(user));
    }),
);

app.get(
    `${SETTINGS.APP_API_PREFIX}/users/me`,
    requireUser,
    asyncHandler(async (request: RequestWithUser, response) => {
        const user = await getCurrentUser(request);
        response.json(toUserProfile(user));
    }),
);

app.patch(
    `${SETTINGS.APP_API_PREFIX}/users/me`,
    requireUser,
    asyncHandler(async (request: RequestWithUser, response) => {
        const payload = request.body as UpdateProfilePayload;
        const user = await getCurrentUser(request);

        if (Object.keys(payload).length === 0) {
            throw badRequest('Nothing to update');
        }

        if (payload.bio !== undefined) {
            if (payload.bio !== null && !isString(payload.bio)) {
                throw badRequest('bio must be string or null');
            }

            user.bio = payload.bio;
        }

        if (payload.avatarUrl !== undefined) {
            if (payload.avatarUrl !== null && !isString(payload.avatarUrl)) {
                throw badRequest('avatarUrl must be string or null');
            }

            user.avatarUrl = payload.avatarUrl;
        }

        const updatedUser = await userRepository().save(user);

        response.json(toUserProfile(updatedUser));
    }),
);

app.patch(
    `${SETTINGS.APP_API_PREFIX}/users/me/password`,
    requireUser,
    asyncHandler(async (request: RequestWithUser, response) => {
        const payload = request.body as ChangePasswordPayload;
        const currentPassword = assertString(payload.currentPassword, 'currentPassword');
        const newPassword = assertString(payload.newPassword, 'newPassword', 8, 72);
        const user = await getCurrentUser(request);

        if (!checkPassword(user.passwordHash, currentPassword)) {
            throw badRequest('Current password is incorrect');
        }

        if (currentPassword === newPassword) {
            throw badRequest('New password must differ from current password');
        }

        user.passwordHash = hashPassword(newPassword);
        await userRepository().save(user);

        response.status(204).send();
    }),
);

app.get(
    '/internal/users/:userId/public',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const userId = Number.parseInt(String(request.params.userId), 10);

        if (Number.isNaN(userId) || userId < 1) {
            throw badRequest('userId must be a positive integer');
        }

        const user = await userRepository().findOneBy({ id: userId });

        if (!user) {
            throw notFound('User with given id was not found', 'USER_NOT_FOUND');
        }

        response.json(toPublicUser(user));
    }),
);

app.post(
    '/internal/users/check',
    requireServiceToken,
    asyncHandler(async (request, response) => {
        const payload = request.body as { userIds?: unknown };

        if (!Array.isArray(payload.userIds) || payload.userIds.length === 0) {
            throw badRequest('userIds must be a non-empty array');
        }

        const userIds = payload.userIds.map((id) => {
            const parsed = Number.parseInt(String(id), 10);

            if (Number.isNaN(parsed) || parsed < 1) {
                throw badRequest('Every user id must be a positive integer');
            }

            return parsed;
        });

        const users = await userRepository()
            .createQueryBuilder('user')
            .where('user.user_id IN (:...userIds)', { userIds })
            .getMany();

        const existingIds = new Set(users.map((user) => user.id));

        response.json({
            users: userIds.map((id) => ({
                id,
                exists: existingIds.has(id),
            })),
        });
    }),
);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
    await authDataSource.initialize();

    app.listen(SETTINGS.AUTH_SERVICE_PORT, SETTINGS.APP_HOST, () => {
        console.log(
            `auth-service listening on ${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.AUTH_SERVICE_PORT}`,
        );
    });
};

void start().catch((error) => {
    console.error('auth-service initialization failed:', error);
    process.exit(1);
});

export default app;
