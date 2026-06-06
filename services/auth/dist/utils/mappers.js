"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserInternal = exports.toUser = void 0;
const toUser = (u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    full_name: u.fullName,
    created_at: u.createdAt,
});
exports.toUser = toUser;
const toUserInternal = (u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    full_name: u.fullName,
});
exports.toUserInternal = toUserInternal;
