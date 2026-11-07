export interface PaginationQuery {
    page?: number;
    limit?: number;
}

export interface PaginationResult {
    page: number;
    limit: number;
    skip: number;
}

export function resolvePagination(query: PaginationQuery): PaginationResult {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
}

export function buildPageMeta(page: number, limit: number, total: number) {
    return {
        page,
        limit,
        total,
    };
}
