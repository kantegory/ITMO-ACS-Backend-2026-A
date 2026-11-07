"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMeta = exports.getPageParams = void 0;
const getPageParams = (query) => {
    const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
    return { page, limit, skip: (page - 1) * limit, take: limit };
};
exports.getPageParams = getPageParams;
const buildMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit) || 0,
});
exports.buildMeta = buildMeta;
//# sourceMappingURL=pagination.js.map