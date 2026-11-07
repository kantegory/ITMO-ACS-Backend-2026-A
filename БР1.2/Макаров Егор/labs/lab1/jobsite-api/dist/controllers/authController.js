"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.login = exports.register = void 0;
const repos_1 = require("../repos");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const httpError_1 = require("../utils/httpError");
const env_1 = require("../config/env");
const enums_1 = require("../entities/enums");
const presenters_1 = require("../presenters");
const buildAuthResponse = (user) => ({
    access_token: (0, jwt_1.signAccessToken)({ sub: user.id, role: user.role }),
    refresh_token: (0, jwt_1.signRefreshToken)({ sub: user.id, role: user.role }),
    token_type: 'Bearer',
    expires_in: env_1.env.jwt.accessExpiresIn,
    user: (0, presenters_1.presentUser)(user),
});
const register = async (req, res) => {
    const { email, password, role, first_name, last_name } = req.body;
    const exists = await repos_1.repos.user().findOne({ where: { email } });
    if (exists)
        throw httpError_1.HttpError.conflict('Email уже зарегистрирован');
    const user = repos_1.repos.user().create({
        email,
        passwordHash: await (0, password_1.hashPassword)(password),
        role,
    });
    await repos_1.repos.user().save(user);
    if (role === enums_1.UserRole.SEEKER) {
        const seeker = repos_1.repos.jobSeeker().create({
            userId: user.id,
            firstName: first_name,
            lastName: last_name,
        });
        await repos_1.repos.jobSeeker().save(seeker);
    }
    else if (role === enums_1.UserRole.EMPLOYER) {
        const employer = repos_1.repos.employer().create({ userId: user.id });
        await repos_1.repos.employer().save(employer);
    }
    res.status(201).json(buildAuthResponse(user));
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await repos_1.repos.user().findOne({ where: { email } });
    if (!user || !(await (0, password_1.verifyPassword)(password, user.passwordHash))) {
        throw httpError_1.HttpError.unauthorized('Неверный email или пароль');
    }
    res.json(buildAuthResponse(user));
};
exports.login = login;
const refresh = async (req, res) => {
    const { refresh_token } = req.body;
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(refresh_token);
    }
    catch {
        throw httpError_1.HttpError.unauthorized('refresh-токен недействителен или истёк');
    }
    const user = await repos_1.repos.user().findOne({ where: { id: payload.sub } });
    if (!user)
        throw httpError_1.HttpError.unauthorized('Пользователь не найден');
    res.json(buildAuthResponse(user));
};
exports.refresh = refresh;
//# sourceMappingURL=authController.js.map