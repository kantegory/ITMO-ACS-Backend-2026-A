"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProfile = void 0;
const toProfile = (p) => ({
    id: p.id,
    user_id: p.userId,
    city: p.city,
    phone: p.phone,
    about: p.about,
    updated_at: p.updatedAt,
});
exports.toProfile = toProfile;
