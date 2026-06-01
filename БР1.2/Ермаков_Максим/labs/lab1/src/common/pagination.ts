export interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}

export const normalizePagination = (
    page?: number,
    limit?: number,
): { page: number; limit: number; skip: number } => {
    const safePage = page && page > 0 ? page : 1;
    const safeLimit = limit && limit > 0 ? Math.min(limit, 100) : 10;

    return {
        page: safePage,
        limit: safeLimit,
        skip: (safePage - 1) * safeLimit,
    };
};

export const buildPaginationMeta = (
    page: number,
    limit: number,
    totalItems: number,
): PaginationMeta => ({
    page,
    limit,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
});
