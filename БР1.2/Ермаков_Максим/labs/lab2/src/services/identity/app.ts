import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { In } from 'typeorm';
import { asyncHandler, createServiceApp, errorHandler } from '../../common/service-app';
import { ApiError, conflict, notFound, unauthorized } from '../../common/api-error';
import { SETTINGS } from '../../common/settings';
import { PHONE_REGEX } from '../../common/validation';
import { getParam } from '../../common/request-params';
import { identityDataSource } from './data-source';
import { User } from './user.entity';
import { bootstrapIdentityData } from './bootstrap';
import { buildAuthTokens, verifyAccessToken } from './tokens';
import { serializeUserProfile, serializeUserSummary } from './serializers';

const app = createServiceApp('identity-service');
const users = () => identityDataSource.getRepository(User);

const getCurrentUser = async (authorization?: string) => {
    if (!authorization) {
        throw unauthorized('Authorization header is required');
    }

    try {
        const payload = verifyAccessToken(authorization);
        const user = await users().findOneBy({ id: payload.user.id });
        if (!user) {
            throw unauthorized('User is not found');
        }
        return user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw unauthorized('Token is invalid or expired');
    }
};

app.post('/auth/register', asyncHandler(async (request, response) => {
    const body = request.body || {};

    if (!body.email || !body.password || !body.passwordConfirmation) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Email and password are required');
    }
    if (body.password !== body.passwordConfirmation) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Password confirmation does not match password');
    }
    if (body.phone && !PHONE_REGEX.test(body.phone)) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Phone format is invalid');
    }
    if (await users().existsBy({ email: body.email })) {
        throw conflict('EMAIL_EXISTS', 'User with this email already exists');
    }
    if (await users().existsBy({ phone: body.phone })) {
        throw conflict('PHONE_EXISTS', 'User with this phone already exists');
    }

    const createdUser = await users().save(
        users().create({
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            phone: body.phone,
            password: body.password,
        }),
    );

    response.status(201).send({
        data: {
            user: serializeUserProfile(createdUser),
            tokens: buildAuthTokens(createdUser),
        },
    });
}));

app.post('/auth/login', asyncHandler(async (request, response) => {
    const { email, password } = request.body || {};
    const user = await users().findOneBy({ email });

    if (!user || !bcrypt.compareSync(password || '', user.password)) {
        throw unauthorized('Email or password is incorrect');
    }

    response.send({
        data: {
            user: serializeUserProfile(user),
            tokens: buildAuthTokens(user),
        },
    });
}));

app.post('/auth/logout', asyncHandler(async (_request, response) => {
    response.send({ message: 'Logged out successfully' });
}));

app.get('/users/me', asyncHandler(async (request, response) => {
    const user = await getCurrentUser(request.header('authorization'));
    response.send({ data: serializeUserProfile(user) });
}));

app.patch('/users/me', asyncHandler(async (request, response) => {
    const user = await getCurrentUser(request.header('authorization'));
    const body = request.body || {};

    if (body.phone && body.phone !== user.phone && await users().existsBy({ phone: body.phone })) {
        throw conflict('PHONE_EXISTS', 'User with this phone already exists');
    }
    if (body.password) {
        if (!body.currentPassword) {
            throw new ApiError(422, 'VALIDATION_ERROR', 'Current password is required to set a new password');
        }
        if (!bcrypt.compareSync(body.currentPassword, user.password)) {
            throw conflict('INVALID_PASSWORD', 'Current password is incorrect');
        }
    }

    Object.assign(user, {
        firstName: body.firstName ?? user.firstName,
        lastName: body.lastName ?? user.lastName,
        phone: body.phone ?? user.phone,
        password: body.password ?? user.password,
    });

    response.send({ data: serializeUserProfile(await users().save(user)) });
}));

app.post('/internal/auth/introspect', asyncHandler(async (request, response) => {
    const token = request.body?.token;
    if (!token) {
        throw unauthorized('Token is required');
    }
    const user = await getCurrentUser(token);
    response.send({
        data: {
            userId: user.id,
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        },
    });
}));

app.get('/internal/users/:userId/summary', asyncHandler(async (request, response) => {
    const user = await users().findOneBy({ id: getParam(request.params.userId, 'userId') });
    if (!user) {
        throw notFound('USER_NOT_FOUND', 'User is not found');
    }
    response.send({ data: serializeUserSummary(user) });
}));

app.post('/internal/users/summaries', asyncHandler(async (request, response) => {
    const userIds = request.body?.userIds || [];
    const foundUsers = userIds.length
        ? await users().findBy({ id: In(userIds) })
        : [];
    response.send({ data: foundUsers.map(serializeUserSummary) });
}));

app.use(errorHandler);

identityDataSource.initialize()
    .then(bootstrapIdentityData)
    .then(() => {
        app.listen(SETTINGS.IDENTITY_PORT, SETTINGS.IDENTITY_HOST, () => {
            console.log(`identity-service listening at http://${SETTINGS.IDENTITY_HOST}:${SETTINGS.IDENTITY_PORT}`);
        });
    })
    .catch((error) => {
        console.error('identity-service failed to start', error);
        process.exit(1);
    });
