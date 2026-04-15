export interface PaginationParams {
    limit: number;
    offset: number;
}

export function getPagination(query: Record<string, unknown>): PaginationParams {
    const limit = Math.min(
        100,
        Math.max(1, Number(query.limit ?? 20) || 20),
    );
    const offset = Math.max(0, Number(query.offset ?? 0) || 0);

    return { limit, offset };
}

export function buildPagination(total: number, offset: number, limit: number) {
    return {
        total,
        offset,
        limit,
        has_more: offset + limit < total,
    };
}
