export const normalizePagination = (page?: unknown, limit?: unknown) => {
    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    return { page: normalizedPage, limit: normalizedLimit };
};

export const buildPaginationMeta = (page: number, limit: number, totalItems: number) => ({
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
});
