"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMe = exports.updateMe = exports.getMe = void 0;
const repos_1 = require("../repos");
const httpError_1 = require("../utils/httpError");
const password_1 = require("../utils/password");
const presenters_1 = require("../presenters");
const getMe = async (req, res) => {
    const user = await repos_1.repos.user().findOne({ where: { id: req.user.id } });
    if (!user)
        throw httpError_1.HttpError.notFound('Пользователь не найден');
    res.json((0, presenters_1.presentUser)(user));
};
exports.getMe = getMe;
const updateMe = async (req, res) => {
    const user = await repos_1.repos.user().findOne({ where: { id: req.user.id } });
    if (!user)
        throw httpError_1.HttpError.notFound('Пользователь не найден');
    const { email, current_password, new_password } = req.body;
    if (email && email !== user.email) {
        const taken = await repos_1.repos.user().findOne({ where: { email } });
        if (taken)
            throw httpError_1.HttpError.conflict('Email уже занят');
        user.email = email;
    }
    if (new_password) {
        if (!current_password || !(await (0, password_1.verifyPassword)(current_password, user.passwordHash))) {
            throw httpError_1.HttpError.validation('Неверный текущий пароль', [
                { field: 'current_password', message: 'Неверный текущий пароль' },
            ]);
        }
        user.passwordHash = await (0, password_1.hashPassword)(new_password);
    }
    await repos_1.repos.user().save(user);
    res.json((0, presenters_1.presentUser)(user));
};
exports.updateMe = updateMe;
const deleteMe = async (req, res) => {
    await repos_1.repos.user().delete({ id: req.user.id });
    res.status(204).send();
};
exports.deleteMe = deleteMe;
//# sourceMappingURL=userController.js.map