"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceTokenMiddleware = serviceTokenMiddleware;
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
function serviceTokenMiddleware(req, _res, next) {
    const token = req.headers["x-service-token"];
    if (token !== env_1.env.serviceToken) {
        return next((0, errors_1.unauthorized)());
    }
    next();
}
