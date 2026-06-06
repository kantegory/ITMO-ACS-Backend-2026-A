"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = validateUser;
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
async function validateUser(userId, role) {
    const url = new URL(`/internal/users/${userId}/validate`, env_1.env.authServiceUrl);
    if (role)
        url.searchParams.set("role", role);
    const res = await fetch(url.toString(), {
        headers: { "X-Service-Token": env_1.env.serviceToken },
    });
    if (res.status === 401)
        throw (0, errors_1.unauthorized)();
    if (res.status === 403)
        throw (0, errors_1.forbidden)();
    if (res.status === 404)
        throw (0, errors_1.unauthorized)();
    if (!res.ok)
        throw new Error(`auth service error: ${res.status}`);
}
